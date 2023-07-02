import { FC } from 'react';
import TextTruncate from './text-truncate/TextTruncate';

import './App.scss';

function generateString(length: number = 1) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

const App: FC<{}> = () => {
  const items = Array.from({ length: 2000 }, (_, i) => `${i}-${generateString(10)}`);

  return (
    <div className='app'>
      {items.map((key) => {
        return <div key={key} className='container'>
          <TextTruncate title={`Test Tooltip text - ${key}`} tailLength={6}>
            {`feature/create-new-text-ellipsis-component-TC2018.02-${key}`}
          </TextTruncate>
        </div>
      })}
    </div>
  );
}

export default App;
