// yjsindex.js
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import * as monaco from 'monaco-editor';

// Set up Monaco Environment for worker URLs
self.MonacoEnvironment = {
  getWorkerUrl: (moduleId, label) => {
    const workerUrls = {
      json: '/dist/json.worker.bundle.js',
      css: '/dist/css.worker.bundle.js',
      html: '/dist/html.worker.bundle.js',
      'typescript': '/dist/ts.worker.bundle.js',
      'javascript': '/dist/ts.worker.bundle.js'
    };
    return workerUrls[label] || '/dist/editor.worker.bundle.js';
  }
};

let sharedLanguage;

// Function to initialize the Monaco Editor
const initializeEditor = async () => {
  return new Promise((resolve) => {
    window.addEventListener('load', () => {
      const ydoc = new Y.Doc();
      const provider = new WebsocketProvider(
        'ws://localhost:4000',
        location.href.includes('/interviewer')
          ? location.href.split('/')[5]
          : location.href.split('/')[4],
        ydoc
      );
      const type = ydoc.getText('monaco');
      sharedLanguage = ydoc.getMap('settings'); // Shared map for settings

      const editor = monaco.editor.create(
        document.getElementById('monaco-editor'),
        {
          value: '',
          theme: 'vs-dark',
          automaticLayout: true,
          language: sharedLanguage.get('language') || 'javascript', // Default to JavaScript
          formatOnType: false,
          formatOnPaste: false,
          suggestOnTriggerCharacters: true // Enable auto-suggestions
        }
      );

      new MonacoBinding(
        type,
        editor.getModel(),
        new Set([editor]),
        provider.awareness
      );

      // Update editor when shared language changes
      sharedLanguage.observe((events) => {
        const language = sharedLanguage.get('language');
        if (language) {
          console.log(location.href);
          document.getElementById('language').value = language
          monaco.editor.setModelLanguage(editor.getModel(), language);
        }
      });

      resolve(editor);
    });
  });
};

// Function to update the shared language
const updateLanguage = (newLanguage) => {
  if (sharedLanguage) {
    sharedLanguage.set('language', newLanguage);
  } else {
    console.error('Shared language map is not initialized.');
  }
};

export { initializeEditor, updateLanguage };
