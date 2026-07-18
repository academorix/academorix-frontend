import { defineBaseConfig } from "../../tsup.config.base";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
  },
  {
    // `vite` is a peer — never bundle it. The tsup base already externalises
    // `dependencies` + `peerDependencies`, but re-declaring `vite` here keeps
    // the intent explicit next to the entry map.
    external: ["vite"],
  },
);
