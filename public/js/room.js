// import * as monaco from "monaco-editor";
import { initializeEditor } from './yjsindex'; 
import * as monaco from "monaco-editor";

document.addEventListener("beforeunload", (e) => { return null });
const openNav = () => {
    document.getElementById("actionbar").style.width = "40%";
    document.getElementById("settings").style.display = "none";
};
const closeNav = () => {
    document.getElementById("actionbar").style.width = "0";
    document.getElementById("settings").style.display = "block";
}



let editor;

initializeEditor().then((initializedEditor) => {
  editor = initializedEditor;

  // Example function to change the theme
  window.changeTheme = () => {
    console.log('Here');
    
    const theme = document.getElementById('theme').value;
    console.log(theme, typeof theme);
    console.log(editor); // Ensure editor is logged here
    
    if (editor) {
        editor.updateOptions({ theme: theme });
    } else {
      console.error('Editor is not properly initialized or does not have setTheme method');
    }
  };

  window.changeLanguage = () => {
    var compilerLinksMap = {
        "java": 'https://www.jdoodle.com/online-java-compiler/',
        "javascript": 'https://www.jdoodle.com/execute-nodejs-online/'
        , "python": 'https://www.jdoodle.com/python3-programming-online/'
        , "mysql": 'https://www.jdoodle.com/execute-sql-online/'
        , "php": 'https://www.jdoodle.com/php-online-editor/'
        , "r": 'https://www.jdoodle.com/execute-r-online/'
        , "cpp": 'https://www.jdoodle.com/online-compiler-c++17/'
        , "csharp": 'https://www.jdoodle.com/compile-c-sharp-online/'
    }
    var language = document.getElementById('language').value;
    console.log('test');
    console.log('Monaco',monaco.editor);
    
    // monaco.editor.setModelLanguage(window.editor.getModel(), language);
    document.getElementById("compile").setAttribute("href", compilerLinksMap[language]);
    //console.log(document.getElementById("compile").href);

    if (editor) {
        console.log(editor);
        
        editor.updateOptions({ language: language });
        monaco.editor.setModelLanguage(editor.getModel(), language);
    } else {
      console.error('Editor is not properly initialized or does not have changeLanguage method');
    }
}
});

// Expose functions to the global scope
window.openNav = openNav;
window.closeNav = closeNav;
// window.changeLanguage = changeLanguage;
// window.changeTheme = changeTheme;
