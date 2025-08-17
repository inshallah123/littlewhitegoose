import React, { useState, useRef } from 'react';
import Modal from 'antd/es/modal';
import Upload from 'antd/es/upload';
import Button from 'antd/es/button';
import Radio from 'antd/es/radio';
import Space from 'antd/es/space';
import message from 'antd/es/message';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useCalendarStore from '../store/calendarStore';

const SettingSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
`;

const PreviewImage = styled.div<{ $url?: string | null }>`
  width: 100%;
  height: 200px;
  border-radius: 8px;
  border: 2px dashed #d9d9d9;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: ${({ $url }) => ($url && $url !== null) ? `url("${$url}")` : 'none'};
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #f5f5f5;
  margin-bottom: 12px;
  color: #999;
`;

const FitModeDescription = styled.div`
  margin-top: 8px;
  font-size: 13px;
  color: #666;
`;

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const backgroundImage = useCalendarStore(state => state.backgroundImage);
  const backgroundFit = useCalendarStore(state => state.backgroundFit);
  const setBackgroundImage = useCalendarStore(state => state.setBackgroundImage);
  const setBackgroundFit = useCalendarStore(state => state.setBackgroundFit);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempImage, setTempImage] = useState<string | null>(backgroundImage);
  const [tempFit, setTempFit] = useState<'cover' | 'contain' | 'stretch' | 'tile'>(backgroundFit);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        message.error('请选择图片文件');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setTempImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = () => {
    setTempImage(null);
  };

  const handleOk = () => {
    setBackgroundImage(tempImage);
    setBackgroundFit(tempFit);
    message.success('设置已保存');
    onClose();
  };

  const handleCancel = () => {
    setTempImage(backgroundImage);
    setTempFit(backgroundFit);
    onClose();
  };

  const fitModeDescriptions = {
    cover: '图片会被缩放以完全覆盖屏幕，可能会裁剪部分图片',
    contain: '图片会完整显示在屏幕内，可能会有空白区域',
    stretch: '图片会被拉伸以适应屏幕，可能会变形',
    tile: '图片会以原始大小平铺显示'
  };

  return (
    <Modal
      title="设置"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={520}
      okText="保存"
      cancelText="取消"
    >
      <SettingSection>
        <SectionTitle>背景图片</SectionTitle>
        
        <PreviewImage $url={tempImage}>
          {!tempImage && '暂无背景图片'}
        </PreviewImage>
        
        <Space>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <Button
            icon={<UploadOutlined />}
            onClick={() => fileInputRef.current?.click()}
          >
            选择图片
          </Button>
          {tempImage && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleRemoveBackground}
            >
              移除背景
            </Button>
          )}
        </Space>
      </SettingSection>

      {tempImage && (
        <SettingSection>
          <SectionTitle>背景适配模式</SectionTitle>
          <Radio.Group
            value={tempFit}
            onChange={(e) => setTempFit(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="contain">完整显示（推荐）</Radio>
              <Radio value="cover">全屏覆盖</Radio>
              <Radio value="stretch">拉伸填充</Radio>
              <Radio value="tile">平铺</Radio>
            </Space>
          </Radio.Group>
          <FitModeDescription>
            {fitModeDescriptions[tempFit]}
          </FitModeDescription>
        </SettingSection>
      )}
    </Modal>
  );
};

export default SettingsModal;