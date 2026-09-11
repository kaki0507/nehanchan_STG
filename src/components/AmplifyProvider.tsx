'use client';

import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';  // ← 相対パスに変更
import { ReactNode } from 'react';

// 一度だけ実行されるようにフラグを設定
let isConfigured = false;

if (!isConfigured) {
  console.log('=== Configuring Amplify ===');
  console.log('User Pool Client ID:', outputs.auth.user_pool_client_id);
  console.log('User Pool ID:', outputs.auth.user_pool_id);
  console.log('Region:', outputs.auth.aws_region);
  
  Amplify.configure(outputs, { ssr: true });
  
  isConfigured = true;
  
  // 設定確認
  const config = Amplify.getConfig();
  console.log('=== Amplify Configured ===');
  console.log('Configured Client ID:', config.Auth?.Cognito?.userPoolClientId);
  console.log('========================');
}

export default function AmplifyProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}