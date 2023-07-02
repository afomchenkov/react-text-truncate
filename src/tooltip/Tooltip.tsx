import { FC, ReactNode, useState } from 'react';
import './Tooltip.scss';

type TooltipProps = {
  children: ReactNode
  text?: string
}

const Tooltip: FC<TooltipProps> = ({ children, text }) => {
  const [show, setShow] = useState(false);

  if (!text) {
    return <>{children}</>;
  }

  return (
    <div className='tooltip-container'>
      <div className={show ? 'tooltip-box visible' : 'tooltip-box'}>
        {text}
        <span className='tooltip-arrow'/>
      </div>
      <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        {children}
      </div>
    </div>
  );
};

export default Tooltip;
