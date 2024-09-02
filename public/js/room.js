import { initializeEditor, updateLanguage } from './yjsindex'; 
import * as monaco from "monaco-editor";

let editor;

// Initialize the editor and set up global functions
(async function initialize() {
  try {
    editor = await initializeEditor();

    // Set up changeTheme function
    window.changeTheme = () => {
      const theme = document.getElementById('theme').value;
      
      if (editor) {
        editor.updateOptions({ theme });
      } else {
        console.error('Editor is not properly initialized.');
      }
    };

    // Set up changeLanguage function
    window.changeLanguage = () => {
      const compilerLinksMap = {
        "java": 'https://www.jdoodle.com/online-java-compiler/',
        "javascript": 'https://www.jdoodle.com/execute-nodejs-online/',
        "python": 'https://www.jdoodle.com/python3-programming-online/',
        "mysql": 'https://www.jdoodle.com/execute-sql-online/',
        "php": 'https://www.jdoodle.com/php-online-editor/',
        "r": 'https://www.jdoodle.com/execute-r-online/',
        "cpp": 'https://www.jdoodle.com/online-compiler-c++17/',
        "csharp": 'https://www.jdoodle.com/compile-c-sharp-online/'
      };

      const language = document.getElementById('language').value;
      const compileLink = compilerLinksMap[language] || '';

      document.getElementById("compile").setAttribute("href", compileLink);
      
      if (editor) {
        // Update the shared language across all participants
        updateLanguage(language);
      } else {
        console.error('Editor is not properly initialized.');
      }
    };
  } catch (error) {
    console.error('Failed to initialize the editor:', error);
  }
})();
