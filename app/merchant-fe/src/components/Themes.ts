export interface Theme {
  body: string;
  text: string;
  background: string;
  componentText: string;
}

export const lightTheme: Theme = {
  body: "#FFF",
  text: "#363537",
  background: "#363537",
  componentText: "#FAFAFA",
};

export const darkTheme: Theme = {
  body: "#363537",
  text: "#FAFAFA",
  background: "#999",
  componentText: "",
};
