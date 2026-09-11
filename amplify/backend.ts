import { defineBackend } from '@aws-amplify/backend';
import { defineFunction } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { Stack, CfnOutput } from 'aws-cdk-lib';
import { CfnRole, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

// Lambda関数をauthスタックに割り当て
const preSignUp = defineFunction({
  name: 'pre-signup',
  entry: './functions/pre-signup/index.ts',
  runtime: 20,
  resourceGroupName: 'auth',
});

const backend = defineBackend({
  auth,
  data,
  preSignUp,
});

// Cognitoのパスワードポリシーをカスタマイズ
const { cfnUserPool } = backend.auth.resources.cfnResources;

cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 6,
    requireLowercase: false,
    requireUppercase: false,
    requireNumbers: false,
    requireSymbols: false,
  },
};

// Pre Sign-upトリガーを設定
cfnUserPool.lambdaConfig = {
  preSignUp: backend.preSignUp.resources.lambda.functionArn,
};

// CognitoがLambda関数を呼び出すためのリソースベースポリシーを追加
backend.preSignUp.resources.lambda.addPermission('CognitoInvokePermission', {
  principal: new ServicePrincipal('cognito-idp.amazonaws.com'),
  sourceArn: backend.auth.resources.userPool.userPoolArn,
});

// Lambda関数の実行ロールに権限を追加（型安全な方法）
const lambdaRole = backend.preSignUp.resources.lambda.role;
if (lambdaRole) {
  const cfnRole = lambdaRole.node.defaultChild as CfnRole;
  
  // Cognitoアクセスポリシーを定義
  const cognitoPolicy = {
    PolicyName: 'CognitoAccessPolicy',
    PolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'cognito-idp:ListUsers',
            'cognito-idp:AdminDeleteUser',
            'cognito-idp:AdminGetUser',
          ],
          Resource: '*',
        },
      ],
    },
  };
  
  // addPropertyOverrideを使用（型安全）
  const currentPolicies = cfnRole.policies;
  if (Array.isArray(currentPolicies)) {
    cfnRole.addPropertyOverride('Policies', [...currentPolicies, cognitoPolicy]);
  } else if (currentPolicies) {
    // IResolvableの場合は新しい配列として設定
    cfnRole.addPropertyOverride('Policies', [cognitoPolicy]);
  } else {
    // ポリシーがない場合
    cfnRole.addPropertyOverride('Policies', [cognitoPolicy]);
  }
  
  console.log('Added Cognito access policy to Lambda execution role');
}

// デバッグ用にLambda関数名を出力
new CfnOutput(Stack.of(backend.preSignUp.resources.lambda), 'PreSignUpFunctionName', {
  value: backend.preSignUp.resources.lambda.functionName,
  description: 'Pre Sign-up Lambda Function Name',
});

// Updated: 2025-02-04 18:15 - Fixed ServicePrincipal import