import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

/** Flap-board tile: rounded rect with split line + hinge dots baked into CSS. */
type FlapTileProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'board' | 'tile' | 'signal' | 'miss' | 'groove';
};

const variantClass: Record<NonNullable<FlapTileProps['variant']>, string> = {
  board:  'bg-board text-tile',
  tile:   'bg-tile text-bg',
  signal: 'bg-signal text-bg',
  miss:   'bg-miss text-tile',
  groove: 'bg-groove text-soft',
};

export const FlapTile = ({ variant = 'board', className = '', children, ...rest }: FlapTileProps) => (
  <div className={`flap-tile ${variantClass[variant]} ${className}`} {...rest}>
    {children}
  </div>
);

/** Primary or secondary button with 48px min-height and press feedback. */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  children?: ReactNode;
};

export const Btn = ({ variant = 'primary', className = '', children, ...rest }: BtnProps) => (
  <button
    className={`press ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} w-full font-bold ${className}`}
    {...rest}
  >
    {children}
  </button>
);

/** Card / panel surface: board-colored with rounded corners and a soft border. */
type SurfaceProps = HTMLAttributes<HTMLDivElement>;

export const Surface = ({ className = '', children, ...rest }: SurfaceProps) => (
  <div className={`surface ${className}`} {...rest}>
    {children}
  </div>
);
