import * as opentype from "./modules/opentype.module.js";
import Font  from "./modules/Font.js";
import ControlBar  from "./modules/Controls.js";
import pangrams from "./modules/pangrams.js";



const mainEl = document.getElementById('content')
const landing = document.getElementById('landing')
const previewZone = document.getElementById('font-preview')
const userText = document.getElementById('userText')
const fontfaceContainer = document.getElementById('previewFont')
const fileOpener = document.getElementById('uploadfont')

HTMLElement.prototype.setAttributes = function(attrs){
    for(var key in attrs) {
        this.setAttribute(key, attrs[key]);
    }
}
HTMLElement.prototype.appendChildren = function(...nodes){
    for(const node of nodes){
        this.appendChild(node)
    }
}

const showErrorMessage = (err)=>{
    console.log(err)
}

const getFileURL = (fontFile)=>{
    return new Promise((res, rej)=>{
        const reader = new FileReader();
        reader.readAsDataURL(fontFile);    
        reader.onload = (e)=>{
            res(e.target.result)
        }    
        reader.onerror = rej
    })
}

const setPreviewText = (str, state)=>{
    userText.textContent = str;
    state.currentText = str;
}

const displayFontData = ()=>{
    if(!mainEl.querySelector('control-bar')){
        const controlBar = new ControlBar()
        mainEl.appendChild(controlBar)

        userText.style.fontFamily = "preview, sans-serif";
        userText.style.fontWeight = "unset";

        landing.style.visibility = "hidden";

        // const selectedfontLocale = currentFont.controls
        const selectedLanguage = currentFont.selectedLanguage?.htmlTag || 'en';
        const langTag = selectedLanguage in pangrams ? selectedLanguage : 'en'
        const textIdx = Math.floor(Math.random() * pangrams[langTag].length)
        setPreviewText(pangrams[langTag][textIdx], controlBar.controls.currentState)

        return
    }
    
    const controlBar = mainEl.querySelector('control-bar');
    controlBar.updateFont()
    
}

const setFontFace = (fontFace)=>{
    const newStyle = document.createElement("style");
    newStyle.appendChild(document.createTextNode(fontFace));

    if(fontfaceContainer.children.length > 0){
        fontfaceContainer.replaceChildren(newStyle)
        return
    }
    fontfaceContainer.appendChild(newStyle);
}

const parseFont = async (fontFile)=>{
    try {
        const opentypeFont = opentype.parse(await fontFile.arrayBuffer())
        return opentypeFont
    } catch (error) {
        showErrorMessage(error)
    }
}

const onFontUploaded = async (fontFile)=>{
    const fileName = fontFile.name;
    const opentypeFont = await parseFont(fontFile)
    const url = await getFileURL(fontFile);
    window.currentFont = new Font(opentypeFont, url, fileName)
    setFontFace(currentFont.fontFace)
    displayFontData(currentFont)
}

const fileOpenHandler = (ev)=>{
    const file = ev.target.files[0];
    window.currentFontFile = file;
    onFontUploaded(currentFontFile)
}

const dropHandler = (ev)=>{
    ev.preventDefault();
    if  (ev.dataTransfer.items.length > 1) {
        showErrorMessage('Please Select Only One File!!')
    }
    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...ev.dataTransfer.items].forEach(async (item, i) => {
            // If dropped items aren't files, reject them
            if (item.kind === "file") {
                window.currentFontFile =await item.getAsFile()
                if ( ['.otf', '.ttf', 'woff'].indexOf(currentFontFile.name.slice(-4)) < 0) {
                    showErrorMessage('Please Only Drop Font File!!')
                    return false
                } 
                onFontUploaded(currentFontFile)
            }
        });
    } else {
        // Use DataTransfer interface to access the file(s)
        [...ev.dataTransfer.files].forEach((file, i) => {
            console.log(`… file[${i}].name = ${file.name}`);
        });
    }
}

const dragOverHandler = (ev)=>{
    ev.preventDefault();
}

const controlsDragHandler = ()=>{
    let isNarrow = document.body.offsetWidth < 768 ? true : false;
    let initialCoord;
    let movement = 0
    let target = 0
    let flexBasisPx = isNarrow ? 0 : 200;
    let flexBasisVp = isNarrow ? 0.4 : 0.1; 
    let viewPort = isNarrow ? document.body.clientHeight : document.body.clientWidth
    let controlsMinSize = isNarrow ? 400 : 300;
    let controlsMaxSize = isNarrow ? 0.6 * viewPort : 0.5 * viewPort;
    let mouseDowned = false
    let controlsClicked = false

    mainEl.addEventListener('mousedown', (ev)=>{
        isNarrow = document.body.offsetWidth < 768 ? true : false;
        
        initialCoord = isNarrow ? ev.clientY : ev.clientX

        mouseDowned = true;

        if (isNarrow){
            target = document.elementsFromPoint(ev.clientX, ev.clientY).find(e=>e.id==='control-bar') ? document.elementsFromPoint(ev.clientX, ev.clientY).find(e=>e.id==='control-bar') : false;
            controlsClicked = target && target.offsetHeight - initialCoord < 7 ? true : false;
        }else{
            target = ev.target.id === 'control-bar' ? ev.target : false;
            controlsClicked = target && initialCoord - target.offsetLeft < 7 ? true : false;
        }
    })
    mainEl.addEventListener('mousemove', (ev)=>{
        if (mouseDowned && controlsClicked){
            movement = isNarrow ? ev.clientY - initialCoord  : initialCoord - ev.clientX

            const [t, p] = isNarrow ? ['40vh', '60vh'] : ['10vw', '90vw']
            
            target.style.flexBasis = `calc(${flexBasisPx + movement}px + ${t})`
            previewZone.style.flexBasis = `calc(${- flexBasisPx - movement}px + ${p})`
        }  
    })
    mainEl.addEventListener('mouseup', (ev)=>{
        if (mouseDowned && controlsClicked){

            mouseDowned = false
            if (flexBasisPx + movement + (viewPort * flexBasisVp ) < controlsMinSize){

                flexBasisPx = controlsMinSize - (viewPort * flexBasisVp) 

            }else if(flexBasisPx + movement + (viewPort * flexBasisVp ) > (controlsMaxSize)){

                flexBasisPx = controlsMaxSize - (viewPort * flexBasisVp) 

            }else{
                flexBasisPx = flexBasisPx + movement 
            }
            movement = 0;

            const [t, p] = isNarrow ? ['40vh', '60vh'] : ['10vw', '90vw']

            target.style.flexBasis = `calc(${flexBasisPx + movement}px + ${t})`
            previewZone.style.flexBasis = `calc(${- flexBasisPx - movement}px + ${p})`
        }
    })
}



mainEl.addEventListener('drop', dropHandler)
mainEl.addEventListener('dragover', dragOverHandler)
fileOpener.addEventListener("change", fileOpenHandler);
controlsDragHandler()
