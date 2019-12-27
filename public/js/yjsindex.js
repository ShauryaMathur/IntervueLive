/* eslint-env browser */

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import * as monaco from "monaco-editor";

self.MonacoEnvironment = {
  getWorkerUrl: function(moduleId, label) {
    if (label === "json") {
      return "/dist/json.worker.bundle.js";
    }
    if (label === "css") {
      return "/dist/css.worker.bundle.js";
    }
    if (label === "html") {
      return "/dist/html.worker.bundle.js";
    }
    if (label === "typescript" || label === "javascript") {
      return "/dist/ts.worker.bundle.js";
    }
    return "/dist/editor.worker.bundle.js";
  }
};

window.addEventListener("load", () => {
  const ydoc = new Y.Doc();

  const provider = new WebsocketProvider(
    'wss:localhost:8443',
    (location.href.indexOf('/interviewer')!=-1)?location.href.split("/")[5].toString():location.href.split("/")[4].toString(),
    ydoc
  );
  console.log(provider);
  const type = ydoc.getText("monaco");

  window.editor = monaco.editor.create(
    document.getElementById("monaco-editor"),
    {
      value: "",
      theme: "vs-dark",
      automaticLayout: true,
      language:"java",
      formatOnType:false,
      formatOnPaste:false
    }
  );
  const monacoBinding = new MonacoBinding(
    type,
    editor.getModel(),
    new Set([editor]),
    provider.awareness
  );

  window.example = { provider, ydoc, type, monacoBinding };
});
