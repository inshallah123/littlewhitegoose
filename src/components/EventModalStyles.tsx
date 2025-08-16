import styled from 'styled-components';
import Modal from 'antd/es/modal';
import Form from 'antd/es/form';

export const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.15),
      0 10px 30px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    overflow: hidden;
    padding: 0;
  }
  
  .ant-modal-header {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    border-bottom: 1px solid rgba(102, 126, 234, 0.1);
    padding: 24px 32px;
    border-radius: 24px 24px 0 0;
    
    .ant-modal-title {
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
    }
  }
  
  .ant-modal-body {
    padding: 32px;
  }
  
  .ant-modal-footer {
    padding: 20px 32px 32px;
    border-top: 1px solid rgba(102, 126, 234, 0.1);
    background: rgba(102, 126, 234, 0.02);
    border-radius: 0 0 24px 24px;
    
    .ant-btn {
      height: 44px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      padding: 0 24px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &.ant-btn-default {
        background: rgba(102, 126, 234, 0.08);
        border: 1px solid rgba(102, 126, 234, 0.2);
        color: #667eea;
        
        &:hover {
          background: rgba(102, 126, 234, 0.15);
          border-color: rgba(102, 126, 234, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
        }
      }
      
      &.ant-btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.3);
        }
        
        &:disabled {
          background: rgba(102, 126, 234, 0.3);
          transform: none;
          box-shadow: none;
        }
      }
    }
  }
`;

export const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 24px;
    
    .ant-form-item-label {
      padding-bottom: 8px;
      
      > label {
        font-weight: 600;
        color: #4a5568;
        font-size: 14px;
        
        &.ant-form-item-required::before {
          color: #667eea;
        }
      }
    }
    
    .ant-input, .ant-input:focus {
      border: 2px solid rgba(102, 126, 234, 0.2);
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 14px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: rgba(102, 126, 234, 0.02);
      
      &:hover {
        border-color: rgba(102, 126, 234, 0.4);
        background: rgba(102, 126, 234, 0.04);
      }
      
      &:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        background: white;
      }
    }
    
    .ant-input::placeholder {
      color: #a0aec0;
      font-style: italic;
    }
    
    .ant-switch {
      background: rgba(102, 126, 234, 0.2);
      
      &.ant-switch-checked {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
    }
  }
`;