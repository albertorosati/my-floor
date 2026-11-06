import React from 'react';

interface FormattedTimeProps {
  seconds: number | string;
  decimals?: number;
  className?: string;
  unitClassName?: string;
}

export const FormattedTime: React.FC<FormattedTimeProps> = ({
  seconds,
  decimals,
  className = '',
  unitClassName = '',
}) => {
  const numeric = typeof seconds === 'number' ? seconds : parseFloat(seconds);
  const formattedNumber =
    typeof decimals === 'number'
      ? numeric.toFixed(decimals)
      : Number.isInteger(numeric)
      ? numeric.toString()
      : numeric.toFixed(1);

  return (
    <span className={`tabular-nums font-display font-black inline-flex items-baseline ${className}`}>
      <span>{formattedNumber}</span>
      <span
        style={{ fontSize: '0.45em' }}
        className={`font-display font-black ml-0.5 lowercase select-none not-italic normal-case ${unitClassName}`}
      >
        s
      </span>
    </span>
  );
};
