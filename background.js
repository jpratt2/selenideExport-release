var extensionId = 'ljdobmomdgdljniojadhoplhkpialdid'; //this is the extensionId of the Katalon Recorder plugin

function formatJavaName(name){
    name = name.replace(/\s+/g,'');//remove whitespace
    name = name.charAt(0).toUpperCase() + name.slice(1);//the file name will automatically have a capitalized first letter; this function will make the class name match the capitalized file name.
         //source: https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
    return name;
}

function register() {
    chrome.runtime.sendMessage(
        extensionId,
        {
            type: 'katalon_recorder_register',
            payload: {
                capabilities: [
                    {
                        id: 'Selenide', // unique ID for each capability
                        summary: 'Selenide Framework', // user-friendly name seen in exporter
                        type: 'export' // for now only 'export' is available
                    }
                ]
            }
        }
    );
}

register();

setInterval(register, 60 * 1000);

chrome.runtime.onMessageExternal.addListener(function(message, sender, sendResponse) {
    if (message.type === 'katalon_recorder_export') {
        var payload = message.payload;
        var commands = payload.commands;
        var testName = formatJavaName(message.payload.name);
        var content = '';
        var extension = '';
        var mimetype = '';
        var indent = '    ';
        switch (payload.capabilityId) {
            case 'Selenide':
                content =   'import org.junit.*;\n' +
                            'import static org.junit.Assert.*;\n' +
                            'import org.openqa.selenium.*;\n' +
                            'import com.codeborne.selenide.*;\n' +
                            'import static com.codeborne.selenide.Selenide.*;\n'   +
                            'import static com.codeborne.selenide.Condition.*;\n' +
                            'import static com.codeborne.selenide.CollectionCondition.*;\n' +
                            'import static com.codeborne.selenide.WebDriverRunner.*;\n';

                content += '\npublic class ' + testName + " {\n\n" +
                            indent + '@Test\n' +
                            indent + "public void " + testName + "() {\n";
                for (var i = 0; i < commands.length; i++) {
                    var command = commands[i];
                    var selenideSyntax = convertKatalonToSelenide(command.command, command.target, command.value);
                    content += selenideSyntax ? indent + indent + selenideSyntax + "\n" : "";
                }
                                
                content +=  indent + "}\n";
                
                if(isAlertPresentFunctionNeededGlb){
                   content +=   "\n" +
                                indent + "public boolean isAlertPresent() {\n" +
                                indent.repeat(2) + "try {\n"   +    
                                indent.repeat(3) + "getWebDriver().switchTo().alert();\n" +
                                indent.repeat(3) + "return true;\n" +
                                indent.repeat(2) +  "} catch (Exception e) {\n" +
                                indent.repeat(3) + "return false;\n" +
                                indent.repeat(2) + "}\n" +
                                indent.repeat(1) + "}\n";
                    
                    //reset global
                    isAlertPresentFunctionNeededGlb = false;
                }

                if(isCookiePresentFunctionNeededGlb){
                    content +=   "\n" +
                                indent + "public boolean isCookiePresent(String cookieName) {\n" +
                                indent.repeat(2) + "Boolean isCookiePresent;\n"   +    
                                indent.repeat(2) + "Cookie cookieAttempt = getWebDriver().manage().getCookieNamed(cookieName);\n" +
                                indent.repeat(2) + "if(cookieAttempt == null){\n" +
                                indent.repeat(3) + "isCookiePresent = false;\n" +
                                indent.repeat(2) + "}else{\n" +
                                indent.repeat(3) + "isCookiePresent = true;\n" +
                                indent.repeat(2) + "}\n" +
                                indent.repeat(2) + "return isCookiePresent;\n" +
                                indent + "}\n";
                    //reset global
                    isCookiePresentFunctionNeededGlb = false;
                }

                content += "\n}";

                extension = 'java';
                mimetype = 'text/plain';        
                break;
        }
        sendResponse({
            status: true,
            payload: {
                content: content,
                extension: extension,
                mimetype: mimetype
            }
        });
    }
});
