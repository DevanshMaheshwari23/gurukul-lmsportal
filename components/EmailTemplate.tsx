'use client';

import React from 'react';

interface EmailTemplateProps {
  title: string;
  previewText?: string;
  content: React.ReactNode;
  footerText?: string;
  color?: string;
}

export default function EmailTemplate({
  title,
  previewText = '',
  content,
  footerText = `© ${new Date().getFullYear()} Gurukul Learning Platform. All rights reserved.`,
  color = '#4f46e5'
}: EmailTemplateProps) {
  return (
    <div>
      {/* 
        This creates better rendering in email clients 
        The preview text will appear in email clients that support it 
      */}
      <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>
        {previewText || title}
      </div>

      {/* Main Container */}
      <table 
        width="100%" 
        border={0} 
        cellPadding="0" 
        cellSpacing="0" 
        role="presentation" 
        style={{ 
          width: '100%', 
          margin: 0, 
          padding: 0, 
          backgroundColor: '#f9fafb',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        <tbody>
          <tr>
            <td align="center" style={{ padding: '20px 0' }}>
              <table
                width="600"
                border={0}
                cellPadding="0"
                cellSpacing="0"
                role="presentation"
                style={{
                  maxWidth: '600px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* Header */}
                <tbody>
                  <tr>
                    <td style={{ backgroundColor: color, padding: '20px', textAlign: 'center' }}>
                      <h1 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                        {title}
                      </h1>
                    </td>
                  </tr>

                  {/* Content */}
                  <tr>
                    <td style={{ padding: '30px 20px' }}>
                      {content}
                    </td>
                  </tr>

                  {/* Footer */}
                  <tr>
                    <td style={{ 
                      borderTop: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      padding: '20px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      <p style={{ margin: 0 }}>
                        {footerText}
                      </p>
                      <p style={{ margin: '10px 0 0 0', fontSize: '12px' }}>
                        This is an automated message. Please do not reply to this email.
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Pre-made content components for common email use cases
export const OTPContent = ({ otp, userName, expiryTime = '10 minutes' }: { otp: string; userName: string; expiryTime?: string }) => (
  <div>
    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.5' }}>
      Hello {userName || 'Valued User'},
    </p>
    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.5' }}>
      Please use the following verification code to complete your request:
    </p>
    <div style={{ 
      backgroundColor: '#f3f4f6', 
      padding: '16px', 
      textAlign: 'center', 
      borderRadius: '6px', 
      margin: '24px 0' 
    }}>
      <p style={{ 
        fontSize: '28px', 
        letterSpacing: '5px', 
        fontWeight: 'bold', 
        color: '#4f46e5', 
        margin: 0 
      }}>
        {otp}
      </p>
    </div>
    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.5' }}>
      This code will expire in {expiryTime} for security reasons.
    </p>
    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.5' }}>
      If you did not request this code, please disregard this email and ensure your account is secure.
    </p>
  </div>
);

export const WelcomeContent = ({ userName, loginLink }: { userName: string; loginLink: string }) => (
  <div>
    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.5' }}>
      Hello {userName || 'Valued User'},
    </p>
    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.5' }}>
      Welcome to Gurukul Learning Platform! We're excited to have you on board.
    </p>
    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.5' }}>
      Your account has been successfully created. You can now access our courses and learning materials.
    </p>
    <div style={{ textAlign: 'center', margin: '30px 0' }}>
      <a 
        href={loginLink} 
        style={{ 
          backgroundColor: '#4f46e5',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 'bold',
          display: 'inline-block'
        }}
      >
        Get Started
      </a>
    </div>
    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.5' }}>
      If you have any questions or need assistance, please don't hesitate to contact our support team.
    </p>
  </div>
); 