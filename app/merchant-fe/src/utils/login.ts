const API_URL = process.env.REACT_APP_API_URL;

export const loginProvider = {
  login: async (code: string): Promise<Nullable<string>> => {
    if (!code) {
      return null;
    }
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      return data.user ?? null;
    } catch (err) {
      console.error(`failed request: ${err}`);
    }
    return null;
  },
};
