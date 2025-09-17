import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    --background-color: #000000;
    --background-input: #ffffff;
    --text-color: #ffffff;
    --text-color-input: #000000;
    --text-secondary-color: #a0a0a0;
    --primary-color: #000000;
    --accent-color: #f97316;
    --accent-hover-color: #e85d04;
    --disabled-color: #444444;
    --success-color: #a8e640;
    --success-hover-color: #97cf2c;
    --border-color: #a0a0a0;
  }
`;
