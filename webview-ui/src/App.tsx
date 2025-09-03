import "./App.css";
import OpenAPISpecForm from "./OpenAPISpecForm";
import { useEffect } from "react";
import { vscode } from "./utilities/vscode";
import type { OpenAPISpecState } from "./features/openapi/openapiSpecSlice";
import { useDispatch } from "react-redux";
import { setSpec } from "./features/openapi/openapiSpecSlice";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    vscode.postMessage({
      command: "ready",
      payload: "Webview Ready",
    });

    const handlVSCodeMessage = (message: MessageEvent) => {
      const { command, payload } = message.data;

      switch (command) {
        case "init state":
          console.log("init state", payload);
          dispatch(setSpec(normalizeSpec(payload)));
          return;
        case "loadSpecInWebview":
          console.log("loadSpecInWebview", payload);
          dispatch(setSpec(normalizeSpec(payload)));
          return;
      }
    };

    window.addEventListener("message", handlVSCodeMessage);

    return () => {
      window.removeEventListener("message", handlVSCodeMessage);
    };
  }, []);

  function normalizeSpec(spec: any): OpenAPISpecState {
    return {
      specData: {
        openapi: spec.openapi ?? "3.0.0",
        info: {
          title: spec.info?.title ?? "Untitled API",
          description: spec.info?.description ?? "",
          version: spec.info?.version ?? "1.0.0",
        },
        servers: spec.servers ?? [],
        components: spec.components ?? {},
        paths: spec.paths ?? {},
      },
    };
  }

  return (
    <>
      <OpenAPISpecForm />
    </>
  );
}

export default App;
