
  export interface Networks {
    [key: number]: string;
  }
  export const walletConnectSupportedNetworks: Networks = {
    // Add your network rpc URL here
    0: "https://rinkeby.infura.io/v3/40c2813049e44ec79cb4d7e0d18de173",
    1: "https://ethereumnode.defiterm.io",
    3: "https://ethereumnode.defiterm-dev.net"
  };

  // Network chain ids
  export const supportedMetamaskNetworks = [1, 3, 4, 5, 42];

  export const ALBT_TOKEN_ADDRESS = "0xc6869a93ef55e1d8ec8fdcda89c9d93616cf0a72";
  export const US_ELECTION_ADDRESS = "0x5155bE53a3144BAf6D2D8a3123Ac1914d5FDF76F";