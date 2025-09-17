import React from 'react';

interface DeleteIconProps {
  onClick: () => void;
}

export default function DeleteIcon({ onClick }: DeleteIconProps) {
  return (
    <svg
      width="18px"
      height="18px"
      fill="white"
      viewBox="0 0 485 485"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <g>
        <g>
          <rect x="67.224" width="350.535" height="71.81" />
          <path
            d="M417.776,92.829H67.237V485h350.537V92.829H417.776z M165.402,431.447h-28.362V146.383h28.362V431.447z M256.689,431.447
        h-28.363V146.383h28.363V431.447z M347.97,431.447h-28.361V146.383h28.361V431.447z"
          />
        </g>
      </g>
    </svg>
  );
}
