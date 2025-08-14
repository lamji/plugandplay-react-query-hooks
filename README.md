# Simple Alert Hook

A lightweight React hook that provides a simple way to show an alert when a button is clicked.

## Installation

```bash
npm install simple-alert-hook
# or
yarn add simple-alert-hook
```

## Usage

```jsx
import React from 'react';
import useAlert from 'simple-alert-hook';

function App() {
  const showAlert = useAlert({ message: 'Hello from the alert hook!' });

  return (
    <div>
      <button onClick={showAlert}>Click me</button>
    </div>
  );
}

export default App;
```

## API

### `useAlert(options?: UseAlertOptions): () => void`

#### Parameters

- `options` (Optional): An object with the following properties:
  - `message` (string, default: 'Button was clicked!'): The message to display in the alert

#### Returns

A function that, when called, will show an alert with the specified message.

## License

MIT
