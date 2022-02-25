import styled from "styled-components";

const Button = styled.button`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.componentText};
  border-radius: 30px;
  cursor: pointer;
  font-size:0.8rem;
  padding: 0.6rem;
`;

export default Button;
