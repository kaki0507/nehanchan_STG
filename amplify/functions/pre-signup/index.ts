import type { PreSignUpTriggerHandler } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  ListUsersCommand, 
  AdminDeleteUserCommand 
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({});

export const handler: PreSignUpTriggerHandler = async (event) => {
  const { userPoolId, request } = event;
  const email = request.userAttributes.email;

  console.log(`[Pre-signup v3] Processing email: ${email}`);

  try {
    // 同じメールアドレスのユーザーを検索
    const listResponse = await client.send(
      new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `email = "${email}"`,
        Limit: 1
      })
    );

    if (listResponse.Users && listResponse.Users.length > 0) {
      const existingUser = listResponse.Users[0];
      console.log(`Found existing user: ${existingUser.Username}, Status: ${existingUser.UserStatus}`);

      // 未確認ユーザーの場合
      if (existingUser.UserStatus === 'UNCONFIRMED') {
        const createdDate = existingUser.UserCreateDate;
        if (!createdDate) {
          console.warn('User creation date not found');
          throw new Error('このメールアドレスは既に登録されています。確認コードをメールでご確認ください。');
        }

        const now = new Date();
        const hoursSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

        console.log(`Hours since creation: ${hoursSinceCreation.toFixed(2)}`);

        // 24時間以上経過している場合は削除して新規登録を許可
        if (hoursSinceCreation >= 24) {
          await client.send(
            new AdminDeleteUserCommand({
              UserPoolId: userPoolId,
              Username: existingUser.Username
            })
          );
          console.log(`Deleted expired unconfirmed user: ${existingUser.Username}`);
        } else {
          // 24時間未満の場合はエラー
          const remainingHours = (24 - hoursSinceCreation).toFixed(1);
          throw new Error(`このメールアドレスは既に登録されています。確認コードをメールでご確認ください。(再登録可能まで約${remainingHours}時間)`);
        }
      } else {
        // 確認済みユーザーの場合
        console.log('User is already confirmed');
        throw new Error('このメールアドレスは既に使用されています。');
      }
    } else {
      console.log('No existing user found, proceeding with sign-up');
    }
  } catch (error) {
    console.error('Error in pre-signup:', error);
    throw error;
  }

  return event;
};

// Updated: 2025-02-04 18:00 - Force Lambda update to apply new IAM permissions