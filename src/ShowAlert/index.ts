import { useCallback } from 'react';

export interface UseAlertOptions {
  message?: string;
}

/**
 * A simple React hook that returns a function to show an alert when called
 * @param options - Optional configuration object
 * @returns A function that triggers an alert when called
 */
const useAlert = (options: UseAlertOptions = {}): (() => void) => {
  const { message = 'Button was clicked!' } = options;

  const showAlert = useCallback(() => {
    alert(message);
  }, [message]);

  return showAlert;
};

export default useAlert;
