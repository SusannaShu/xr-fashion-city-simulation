import React from 'react';
import styles from './LoadingSpinner.module.css';
import { classNames } from '../../utils/classNames';

export type SpinnerSize = 'small' | 'medium' | 'large';
export type SpinnerTheme = 'light' | 'dark' | 'primary';

export interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default 'medium'
   */
  size?: SpinnerSize;
  /**
   * Color theme of the spinner
   * @default 'light'
   */
  theme?: SpinnerTheme;
  /**
   * Label to display below the spinner
   */
  label?: string;
  /**
   * Progress value (0-100)
   */
  progress?: number;
  /**
   * Whether to show the spinner in a full-screen overlay
   * @default false
   */
  overlay?: boolean;
  /**
   * Additional CSS class names
   */
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  theme = 'light',
  label,
  progress,
  overlay = false,
  className,
}) => {
  const spinner = (
    <div className={styles.container}>
      <div
        className={classNames(
          styles.spinner,
          styles[size],
          styles[theme],
          className
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label={label || 'Loading'}
      />
      {label && <span className={styles.label}>{label}</span>}
      {typeof progress === 'number' && (
        <span className={styles.progress}>{Math.round(progress)}%</span>
      )}
    </div>
  );

  if (overlay) {
    return <div className={styles.overlay}>{spinner}</div>;
  }

  return spinner;
};

export default LoadingSpinner;
