'use client';

import { Modal } from 'antd';
import type { ModalProps } from 'antd';
import type { ReactNode } from 'react';

const MODAL_BODY_MAX_HEIGHT = 'calc(100vh - 200px)';

export interface AppModalProps {
  title: ReactNode;
  subtitle?: ReactNode;
  open?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number | string;
  zIndex?: number;
  centered?: boolean;
  maskClosable?: boolean;
  className?: string;
  modalProps?: Omit<
    ModalProps,
    'title' | 'open' | 'onCancel' | 'footer' | 'children' | 'width' | 'centered'
  >;
}

function ModalTitle({
  title,
  subtitle,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  if (!subtitle) return <>{title}</>;

  return (
    <div>
      <div>{title}</div>
      <div className="mt-0.5 text-sm font-normal text-gray-500">{subtitle}</div>
    </div>
  );
}

export function AppModal({
  title,
  subtitle,
  open = true,
  onClose,
  children,
  footer,
  width = 520,
  zIndex,
  centered = true,
  maskClosable = true,
  className,
  modalProps,
}: AppModalProps) {
  const { mask: maskProp, ...restModalProps } = modalProps ?? {};
  const maskConfig =
    typeof maskProp === 'object' && maskProp !== null
      ? { closable: maskClosable, ...maskProp }
      : { closable: maskClosable };

  return (
    <Modal
      title={<ModalTitle title={title} subtitle={subtitle} />}
      open={open}
      onCancel={onClose}
      footer={footer ?? null}
      width={width}
      centered={centered}
      zIndex={zIndex}
      mask={maskConfig}
      destroyOnHidden
      className={className}
      styles={{
        body: {
          maxHeight: MODAL_BODY_MAX_HEIGHT,
          overflowY: 'auto',
          paddingTop: 16,
        },
        footer: {
          textAlign: 'unset',
        },
        ...restModalProps.styles,
      }}
      {...restModalProps}
    >
      {children}
    </Modal>
  );
}
