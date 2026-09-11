'use client';

import { Authenticator, translations, useAuthenticator } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import '@aws-amplify/ui-react/styles.css';
import './authenticator-styles.css';
import React, { useState } from 'react';

I18n.putVocabularies({
  ja: {
    ...translations.ja,
    'Sign In': 'ログイン',
    'Sign Up': '新規登録',
    'Create Account': '新規登録',
    'Sign in': 'ログイン',
    'Forgot your password?': 'パスワードをお忘れの方はこちら',
    'Reset Password': 'パスワードをリセット',
    'Reset your password': 'パスワードをリセット',
    'Back to Sign In': 'ログインに戻る',
    'Send Code': 'コードを送信',
    'Send code': 'コードを送信',
    'Submit': '送信',
    'Email': 'メールアドレス',
    'Password': 'パスワード',
    'Confirm Password': 'パスワード(確認)',
    'Code': '確認コード',
    'New Password': '新しいパスワード',
    'Confirmation Code': '確認コード',
    'Confirm': '確認',
    'We Emailed You': 'パスワードリセット用のコードを送信しました',
    'Your code is on the way. To log in, enter the code we emailed to': 
      'パスワードリセット用の確認コードを送信しました。以下のメールアドレスに送信されたコードを入力してください:',
    'It may take a minute to arrive.': 'メールが届くまでしばらく時間がかかる場合があります。',
    '. It may take a minute to arrive.': ' メールが届くまでしばらく時間がかかる場合があります。',
    'It may take a minute to arrive': 'メールが届くまでしばらく時間がかかる場合があります',
    'Resend Code': '',
    'Confirm Sign Up': 'アカウントを確認',
    'Confirm Reset Password': 'パスワードをリセット',
    'Enter your code': '確認コードを入力',
    'Enter your Confirmation Code': '確認コードを入力',
    'Enter your email': 'メールアドレスを入力',
    'Password must have at least 8 characters': 'パスワードは8文字以上で入力してください',
    'Password must have length greater than or equal to 8': 'パスワードは8文字以上で入力してください',
    'Your passwords must match': 'パスワードが一致しません',
    'Username cannot be empty': 'メールアドレスを入力してください',
    'Cannot reset password for the user as there is no registered/verified email or phone_number': 
      '確認コードを登録していない場合、パスワードのリセットは行えません。お手数ですが、24時間後に再度アカウントの新規登録を行ってください。',
  }
});

I18n.setLanguage('ja');

// メモ機能説明モーダルコンポーネント
function MemoInfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      image: '/memo/list.png',
      title: 'メモ一覧',
      description: 'メモを作成し一覧管理する機能です\nキャラ・分類で絞り込み、作成日順・重要度順・分類順で並び替えが可能です'
    },
    {
      image: '/memo/create.png',
      title: 'メモ作成',
      description: 'あなただけのメモを作成・編集することが可能です\nメモはアカウントごとに管理され、他者には見えません'
    },
    {
      image: '/memo/category.png',
      title: '分類管理',
      description: 'メモに使用する分類はご自身で追加・削除が可能です'
    }
  ];

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '95vh',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(127, 29, 29, 0.15))',
          border: '3px solid',
          borderImage: 'linear-gradient(135deg, #dc2626, #991b1b) 1',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid rgba(185, 28, 28, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          flexShrink: 0
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#fef2f2',
            margin: 0,
            textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
          }}>
            メモ機能について
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(185, 28, 28, 0.3)',
              border: '2px solid rgba(185, 28, 28, 0.5)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '24px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(185, 28, 28, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(185, 28, 28, 0.3)';
            }}
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div style={{
          padding: '40px 40px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflowY: 'auto',
          flex: 1
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#fca5a5',
            marginBottom: '20px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.9)'
          }}>
            {pages[currentPage].title}
          </h3>

          <div style={{
            marginBottom: '20px',
            width: '100%',
            borderRadius: '8px',
            border: '2px solid rgba(185, 28, 28, 0.3)',
            background: 'rgba(0, 0, 0, 0.3)',
            overflow: 'hidden'
          }}>
            <img
              src={pages[currentPage].image}
              alt={pages[currentPage].title}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          </div>

          <p style={{
            fontSize: '16px',
            color: '#e5e7eb',
            lineHeight: '1.8',
            whiteSpace: 'pre-line',
            maxWidth: '600px',
            marginTop: '10px'
          }}>
            {pages[currentPage].description}
          </p>
        </div>

        {/* ナビゲーション */}
        <div style={{
          padding: '20px',
          borderTop: '2px solid rgba(185, 28, 28, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          flexShrink: 0
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            style={{
              padding: '10px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: currentPage === 0 ? 'rgba(107, 114, 128, 0.3)' : 'rgba(185, 28, 28, 0.3)',
              border: '2px solid',
              borderColor: currentPage === 0 ? 'rgba(107, 114, 128, 0.5)' : 'rgba(185, 28, 28, 0.5)',
              borderRadius: '6px',
              color: currentPage === 0 ? '#6b7280' : '#fca5a5',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ← 前へ
          </button>

          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            {pages.map((_, index) => (
              <div
                key={index}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: currentPage === index ? '#dc2626' : 'rgba(185, 28, 28, 0.3)',
                  border: '2px solid rgba(185, 28, 28, 0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setCurrentPage(index)}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
            disabled={currentPage === pages.length - 1}
            style={{
              padding: '10px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: currentPage === pages.length - 1 ? 'rgba(107, 114, 128, 0.3)' : 'rgba(185, 28, 28, 0.3)',
              border: '2px solid',
              borderColor: currentPage === pages.length - 1 ? 'rgba(107, 114, 128, 0.5)' : 'rgba(185, 28, 28, 0.5)',
              borderRadius: '6px',
              color: currentPage === pages.length - 1 ? '#6b7280' : '#fca5a5',
              cursor: currentPage === pages.length - 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            次へ →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showMemoInfo, setShowMemoInfo] = useState(false);

  return (
    <>
      {/* CSS のみで削除 - JavaScript不使用 */}
      <style jsx global>{`
        /* Resend Codeボタン完全非表示 */
        [data-amplify-router="confirmSignUp"] button[type="button"],
        [data-amplify-router="confirmResetPassword"] button[type="button"],
        [data-amplify-router="confirmSignIn"] button[type="button"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          position: absolute !important;
          left: -10000px !important;
          pointer-events: none !important;
        }
      `}</style>
      
      {/* 背景を持つ外側のコンテナ */}
      <div style={{
        minHeight: '100vh',
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)),
          url('/backgrounds/background.jpg')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23991b1b' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          zIndex: 0
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Authenticator
            loginMechanisms={['email']}
            signUpAttributes={['email']}
            components={{
              SignIn: {
                Header() {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px 20px 10px',
                      borderBottom: '1px solid rgba(185, 28, 28, 0.2)'
                    }}>
                      <p style={{
                        fontSize: '14px',
                        color: '#e5e7eb',
                        marginBottom: '12px',
                        lineHeight: '1.5'
                      }}>
                        メモ機能をご利用いただくにはアカウント登録が必要です
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowMemoInfo(true)}
                        style={{
                          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.8), rgba(153, 27, 27, 0.8))',
                          border: '2px solid #fca5a5',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          padding: '10px 24px',
                          textDecoration: 'none',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                          transition: 'all 0.3s ease',
                          display: 'inline-block'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 12px rgba(220, 38, 38, 0.5)';
                          e.currentTarget.style.borderColor = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
                          e.currentTarget.style.borderColor = '#fca5a5';
                        }}
                      >
                        📝 メモ機能とは
                      </button>
                    </div>
                  );
                },
                Footer() {
                  const { toForgotPassword } = useAuthenticator();
                  
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      borderTop: '1px solid rgba(185, 28, 28, 0.2)'
                    }}>
                      <button
                        type="button"
                        onClick={toForgotPassword}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#60a5fa',
                          fontSize: '14px',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          padding: '8px',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#93c5fd';
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#60a5fa';
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        パスワードをお忘れの方はこちら
                      </button>
                    </div>
                  );
                }
              },
              SignUp: {
                Header() {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px 20px 10px',
                      borderBottom: '1px solid rgba(185, 28, 28, 0.2)'
                    }}>
                      <p style={{
                        fontSize: '14px',
                        color: '#e5e7eb',
                        marginBottom: '12px',
                        lineHeight: '1.5'
                      }}>
                        メモ機能をご利用いただくにはアカウント登録が必要です
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowMemoInfo(true)}
                        style={{
                          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.8), rgba(153, 27, 27, 0.8))',
                          border: '2px solid #fca5a5',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          padding: '10px 24px',
                          textDecoration: 'none',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                          transition: 'all 0.3s ease',
                          display: 'inline-block'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 12px rgba(220, 38, 38, 0.5)';
                          e.currentTarget.style.borderColor = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
                          e.currentTarget.style.borderColor = '#fca5a5';
                        }}
                      >
                        📝 メモ機能とは
                      </button>
                    </div>
                  );
                }
              },
              ConfirmSignUp: {
                Header() {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '30px 20px 10px',
                    }}>
                      <h2 style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginBottom: '15px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
                      }}>
                        確認用Eメールを送信しました
                      </h2>
                    </div>
                  );
                },
                Footer() {
                  return null;
                }
              },
              ConfirmSignIn: {
                Header() {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '30px 20px 10px',
                    }}>
                      <h2 style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginBottom: '15px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
                      }}>
                        確認用Eメールを送信しました
                      </h2>
                    </div>
                  );
                },
                Footer() {
                  return null;
                }
              },
              ForgotPassword: {
                Header() {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '30px 20px 10px',
                    }}>
                      <h2 style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginBottom: '15px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
                      }}>
                        パスワードをリセット
                      </h2>
                    </div>
                  );
                },
                Footer() {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '15px 20px 20px',
                      borderTop: '1px solid rgba(185, 28, 28, 0.2)',
                      marginTop: '20px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#d1d5db',
                        lineHeight: '1.6',
                        padding: '10px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '6px',
                        border: '1px solid rgba(185, 28, 28, 0.2)'
                      }}>
                        ※ 確認用メールが迷惑メールフォルダ等にも届かない場合、システムにメールアドレスが登録されていない可能性がございます。アカウント新規登録をお試しください。
                      </div>
                    </div>
                  );
                }
              },
              ConfirmResetPassword: {
                Header() {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '30px 20px 10px',
                    }}>
                      <h2 style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginBottom: '15px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
                      }}>
                        パスワードリセット用のコードを送信しました
                      </h2>
                    </div>
                  );
                },
                Footer() {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '15px 20px 20px',
                      borderTop: '1px solid rgba(185, 28, 28, 0.2)',
                      marginTop: '20px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#ffffff',
                        lineHeight: '1.7',
                        padding: '12px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '6px',
                        border: '1px solid rgba(185, 28, 28, 0.2)'
                      }}>
                        <p style={{ margin: '0 0 8px 0' }}>
                          確認用メールが迷惑メールフォルダ等にも届かない場合、システムにメールアドレスが登録されていない可能性がございます。
                        </p>
                        <p style={{ margin: 0 }}>
                          アカウント新規登録をお試しください。
                        </p>
                      </div>
                    </div>
                  );
                }
              },
            }}
            services={{
              async validateCustomSignUp(formData: Record<string, any>) {
                if (!formData.password || formData.password.length < 8) {
                  return {
                    password: 'パスワードは8文字以上で入力してください'
                  };
                }
              }
            }}
          >
            {({ signOut, user }: { signOut?: () => void; user?: any }) => (
              <div>
                {children}
              </div>
            )}
          </Authenticator>
        </div>
      </div>

      {/* メモ機能説明モーダル */}
      <MemoInfoModal isOpen={showMemoInfo} onClose={() => setShowMemoInfo(false)} />
    </>
  );
}
