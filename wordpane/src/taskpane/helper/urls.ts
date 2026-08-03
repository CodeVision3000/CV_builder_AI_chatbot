export const apiURL = (path: string) => {
  return `${process.env.REACT_APP_API_URL}/${path}`;
};

export const m365SignInURL =
  process.env.REACT_APP_M365_SIGNIN_URL || apiURL("auth/microsoft/login");
