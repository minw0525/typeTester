import featureDefaults from "./opentypeFeatureDefaults.js";
import Settings from "./Settings.js";

const userText = document.getElementById('userText')

const requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame;

const cancelAnimationFrame =
  window.cancelAnimationFrame || window.mozCancelAnimationFrame;


class ToolboxHeader extends HTMLElement{
    constructor(){
        super()
        this.familyEl = document.createElement('h1')
        this.instancesSelect = document.createElement('select')
        
        this.prop = 'instance'

        this.currentState = {}
    }
    connectedCallback(){
        this.setData()
        this.initializeUI()
    }
    setData(){
        this.family = this.controls.font.family;
        this.presets = this.controls.font.presets;
        this.styleName = this.controls.font.style;
    }
    initializeUI(){
        this.appendChildren(this.familyEl, this.instancesSelect)
        this.instancesSelect.addEventListener('change', this.changeHandler.bind(this))

        this.instancesSelect.innerHTML = ''
        if(this.presets.length === 1){
            this.instancesSelect.disabled = true;
        }

        for(const idx in this.presets){
            const option = document.createElement('option');
            option.textContent = this.presets[idx].name.en;
            option.value = idx;
            this.instancesSelect.appendChild(option)
        }

        this.currentState[this.prop] = this.controls.font.selectedPreset, 
        this.updateState(this.prop, this.currentState[this.prop])
        this.updateUI()
    }

    updateUI(){
        this.familyEl.textContent = this.family;
        this.instancesSelect.value = this.controls.currentState[this.prop][1];
        if(this.controls.currentState[this.prop][0].coordinates){
            this.controls.updateInstance()
        }
    }
    changeHandler(ev){
        this.currentState[this.prop] = [this.presets[ev.target.value], ev.target.value]
        this.updateState(this.prop, this.currentState[this.prop])
        this.updateUI()
    }

    updateState(prop, value){
        this.controls.currentState[prop] = value;
    }
}


class InputRange extends HTMLElement{
    constructor(){
        super()
        this.header = document.createElement('div')
        this.label = document.createElement('label')
        this.inputText = document.createElement('input')
        this.inputRange = document.createElement('input')
        this.datalist = document.createElement('datalist')

        this.inputs = [this.inputRange, this.inputText]

        this.header.classList.add("rangeHeader", "flex")
        this.inputRange.classList.add("sliderRange")
        this.inputText.classList.add("sliderLabel")
        this.inputRange.setAttributes({'type':'range', 'list':'inputSnaps'})
        this.inputText.setAttributes({"type": "text", "inputmode":"decimal", "number":"true", "autocomplete":"off"})

        this.header.appendChildren(this.label, this.inputText)

        this.currentState = {}
    }
    connectedCallback(){
        this.setData()
        this.initializeUI()
    }
    setData(){
        this.min = this.data.min;
        this.max = this.data.max;
        this.default = this.data.default;
        this.step = this.data.step;
        this.prop = this.data.prop;
        this.unit = this.data.unit??'';
    }

    initializeUI(){
        this.appendChildren(this.header, this.inputRange, this.datalist)
        this.label.textContent = this.name;
        this.currentState[this.prop] = this.controls.currentState.basics[this.prop]? this.controls.currentState.basics[this.prop][0] :this.default;
        for (const input of this.inputs){
            input.min = this.min;
            input.max = this.max;
            input.step = this.step;
            input.value = this.default;
            input.addEventListener('input', this.inputHandler.bind(this))
        }

        this.snaps = [this.data.min, this.data.default, this.data.max]
        this.datalist.id = `${this.prop}Snaps`
        this.inputRange.setAttributes({'list':`${this.prop}Snaps`})

        for (const snap of this.snaps){
            const option = document.createElement('option')
            option.textContent = snap
            this.datalist.appendChild(option)
        }

        this.updateState(this.prop, [ this.currentState[this.prop], this.unit??''])
        this.updateUI()
    }
    updateUI(){
        for (const input of this.inputs){
            input.value = this.controls.currentState.basics[this.prop][0];
        }
        this.controls.updateFontCSS()//this.prop,`${this.controls.currentState.basics[this.prop][0]}${this.controls.currentState.basics[this.prop][1]}`);
    }

    inputHandler(ev){
        if (ev.target.value < this.min){
            this.currentState[this.prop] = this.min
        }else if (ev.target.value > this.max){
            this.currentState[this.prop] = this.max
        }else{
            this.currentState[this.prop] = ev.target.value
        }
        this.updateState(this.prop, [ this.currentState[this.prop], this.unit??''])
        this.updateUI()
    }

    updateState(prop, value){
        // this.controls.currentState[prop] = value;
        this.controls.currentState.basics[prop] = value;
    }
    
}

class VariableInputRange extends HTMLElement{
    constructor(){
        super()
        this.header = document.createElement('div')
        this.labelName = document.createElement('label')
        this.labelTag = document.createElement('span')
        this.inputText = document.createElement('input')
        this.header.appendChildren(this.labelName, this.inputText)
        this.header.classList.add("rangeHeader", "flex")

        this.content = document.createElement('div')
        this.playButton = document.createElement('button')
        this.inputRange = document.createElement('input')
        
        this.content.appendChildren(this.playButton, this.inputRange)
        this.content.classList.add("rangeContent", "flex")
        this.playButton.classList.add("paused")

        this.datalist = document.createElement('datalist')

        this.inputs = [this.inputRange, this.inputText]

        this.inputRange.classList.add("sliderRange")
        this.inputText.classList.add("sliderLabel")
        this.inputRange.setAttributes({'type':'range', 'list':'inputSnaps'})
        this.inputText.setAttributes({"type": "text", "inputmode":"decimal", "number":"true", "autocomplete":"off"})
        
        this.labelName.appendChild(this.labelTag)

        this.currentState = {}
    }
    connectedCallback(){
        this.setData()
        this.initializeUI()
    }
    setData(){
        this.name = this.axis.name.en||this.tag;
        this.min = this.axis.minValue;
        this.max = this.axis.maxValue;
        this.default = Math.round(this.axis.defaultValue * 100) / 100;
        this.valueStep = this.max - this.min > 50 ? 1 : this.max - this.min > 10 ?  0.1 : 0.01
        this.prop = this.axis.tag;
        this.playSpeed = this.controls.currentState.playSpeed;
        this.playStep = (this.max - this.min) / 100
        this.playing = false;
        this.playingDirection = 1;
    }
    initializeUI(){
        this.appendChildren(this.header, this.content, this.datalist)
        this.labelName.textContent = this.name;
        this.labelTag.textContent = this.tag;

        this.currentState[this.prop] = this.controls.currentState.variations[this.prop]? this.controls.currentState.variations[this.prop]:this.default;

        for (const input of this.inputs){
            input.min = this.min;
            input.max = this.max;
            input.step = this.valueStep
            input.value = this.default;

            input.addEventListener('input', this.inputHandler.bind(this))
            
            input.classList.add(`${this.prop}input`)
        }
        this.snaps = [this.min, this.default, this.max]
        this.datalist.id = `${this.prop}Snaps`
        this.inputRange.setAttributes({'list':`${this.prop}Snaps`})

        for (const snap of this.snaps){
            const option = document.createElement('option')
            option.textContent = snap
            this.datalist.appendChild(option)
        }

        this.playButton.addEventListener('click', this.btnEventHandler.bind(this))

        this.updateState(this.prop, this.currentState[this.prop])
        this.updateUI()
    }
    updateUI(){
        for (const input of this.inputs){
            input.value = this.controls.currentState.variations[this.prop];
            // console.log(this.controls.currentState[this.prop]);
        }
        this.controls.updateVariationCSS(this.prop, this.controls.currentState.variations[this.prop]);
    }
    inputHandler(ev){
        if (ev.target.value < this.min){
            this.currentState[this.prop] = this.min
        }else if (ev.target.value > this.max){
            this.currentState[this.prop] = this.max
        }else{
            this.currentState[this.prop] = parseFloat(ev.target.value)
        }
        // console.log(1, this.currentState[this.prop], 2, this.controls.currentState[this.prop])
        this.updateState(this.prop, this.currentState[this.prop])
        this.updateUI()
    }
    btnEventHandler(){
        if (this.playing){
            this.stopAnimation()
            return
        }
        this.playAnimation() 
    }
    animate(){
        let increment = this.playStep * this.playSpeed;
        increment = increment >= this.valueStep ? increment : this.valueStep
        let next = this.currentState[this.prop] + (this.playingDirection * increment)
        if (next >= this.max){
            next = this.max
            this.playingDirection = -1
        }
        if (next <= this.min){
            next = this.min
            this.playingDirection = 1
        }
        // console.log(next, increment, this.valueStep)
        this.currentState[this.prop] = Math.round(next / this.valueStep) / ( 1/ this.valueStep)
        this.updateState(this.prop, this.currentState[this.prop])
        this.updateUI()

        this.animation = requestAnimationFrame(()=>{
            this.animate()
        })
    }
    playAnimation(){
        if(this.playing){return}
        this.playButton.classList.replace("paused", "playing")
        this.playing = true
        this.controls.currentState.globalPlaying++;
        this.animate()
        if(this.controls.currentState.globalPlaying === this.controls.font.variationAxes.length){
            this.globalPlayBtn.textContent = 'Stop All'    
            this.globalPlayBtn.classList.replace("paused", "playing")
        }

    }
    stopAnimation(){
        if(!this.playing){return}
        if(this.controls.currentState.globalPlaying === this.controls.font.variationAxes.length){
            this.globalPlayBtn.textContent = 'Play All'    
            this.globalPlayBtn.classList.replace("playing", "paused")
        }
        this.playButton.classList.replace("playing", "paused")
        this.playing = false
        this.controls.currentState.globalPlaying--;
        cancelAnimationFrame(this.animation)
        
    }
    updateState(prop, value){
        // this.controls.currentState[prop] = value;
        this.controls.currentState.variations[prop] = value;
    }
}

class FeatureBlock extends HTMLElement{
    constructor(){
        super()
        
        this.checkbox = document.createElement('input')
        this.labelName = document.createElement('label')
        this.labelTag = document.createElement('span')

        this.checkbox.setAttributes({"type": "checkbox"})
        this.labelTag.classList.add('sliderLabel')

        this.currentState = {}
    }
    connectedCallback(){
        this.setData()
        this.initializeUI()
    }
    setData(){
        this.name = this.feature.name;
        this.uiName = this.feature.uiName;
        this.prop = this.feature.tag;
        // this.featureGroup = 

    }
    initializeUI(){
        this.appendChildren(this.checkbox, this.labelName, this.labelTag)

        if (featureDefaults.indexOf(this.prop )>-1){
            this.checkbox.checked = true;
        }

        this.currentState[this.prop] = this.controls.currentState.features[this.prop]? this.controls.currentState.features[this.prop] : this.checkbox.checked

        this.checkbox.id = `${this.prop}Box`;

        this.labelName.textContent = this.uiName||this.name;
        this.labelName.setAttributes({"for": `${this.prop}Box`})

        this.labelTag.textContent = this.prop;


        this.checkbox.addEventListener('change', this.changeHandler.bind(this))

        this.updateState(this.prop, this.currentState[this.prop])
        this.updateUI()
    }
    updateUI(){
        this.checkbox.checked = this.controls.currentState.features[this.prop]
        this.controls.updateFeatureCSS(this.prop, this.controls.currentState.features[this.prop])
    }
    changeHandler(ev){
        this.currentState[this.prop] = ev.target.checked;
        this.updateState(this.prop, this.currentState[this.prop])
        this.updateUI()
    }
    updateState(prop, value){
        // this.controls.currentState[prop] = value;
        this.controls.currentState.features[prop] = value;
    }
}

class ColorBlock extends HTMLElement{
    constructor(){
        super()
        
        this.labelName = document.createElement('label')
        this.inputCode = document.createElement('input')
        this.inputColor = document.createElement('input')

        this.inputs = [this.inputCode, this.inputColor]

        this.inputCode.setAttributes({"type": "text"})
        this.inputColor.setAttributes({"type": "color"})
        this.inputCode.classList.add("sliderLabel")
        
        this.currentState = {}

    }
    connectedCallback(){
        this.setData()
        this.initializeUI()
    }
    setData(){
        this.colorCode = this.data.defaultValue;
        this.prop = this.data.prop;
        this.default = this.data.defaultValue;
    }
    initializeUI(){
        this.appendChildren(this.labelName, this.inputCode, this.inputColor)
        this.inputColor.addEventListener('input', this.inputHandler.bind(this));
        this.inputCode.addEventListener('change', this.changeHandler.bind(this));
        this.labelName.textContent = this.name;
        this.currentState[this.prop] = this.controls.currentState.colors[this.prop]? this.controls.currentState.colors[this.prop]: `#${this.default}`;

        this.updateState(this.prop, this.currentState[this.prop])
        this.updateUI()
    }
    updateUI(){
        this.inputCode.value = this.controls.currentState.colors[this.prop];
        this.inputColor.value = this.controls.currentState.colors[this.prop];

        this.controls.updateColor()
    }
    inputHandler(ev){
        this.currentState[this.prop] = ev.target.value.toUpperCase()
        this.updateState(this.prop, this.currentState[this.prop])
        this.updateUI()
    }
    changeHandler(ev){
        let temp;
        if(!ev.target.value.startsWith('#')){
            temp = parseInt(checkIf3letters(ev.target.value), 16) || this.default;
            temp = `#${temp.toString(16)}`

        }else{
            temp = parseInt(checkIf3letters(ev.target.value.slice(1)),16) || this.default;
            temp = `#${temp.toString(16)}`
        }
        this.currentState[this.prop] = temp.slice(0,7).toUpperCase().padEnd(7,'0')

        this.updateState(this.prop, this.currentState[this.prop])
        this.updateUI()

        function checkIf3letters(str){
            if (str.length === 3){
                return str.split('').flatMap(e=>[e,e]).join('')
            }else{ return str }
        }
    }
    updateState(prop, value){
        // this.controls.currentState[prop] = value;
        this.controls.currentState.colors[prop] = value;
    }
}

class ToolBox extends HTMLElement{
    constructor(){
        super()
        this.label = document.createElement('label');
        this.appendChild(this.label)
    }
    connectedCallback(){
        this.setData();
        this.initializeUI()
    }
    setData(){
        this.font = this.controls.font
        this.settings = this.controls.settings;
        this.label.textContent = this.name;
        this.label.classList.add('toolBoxName');
    }
    initializeUI(){
        switch (this.label.textContent) {
            case this.settings.toolBoxes[0]: 
                this.setState('instance')
                this.buildInstanceSelector()
                break;
            case this.settings.toolBoxes[1]: 
                this.setState('basics')
                this.buildBasicControls()
                break;
            case this.settings.toolBoxes[2]: 
                this.setState('variations')
                this.buildVariableControls()
                break;
            case this.settings.toolBoxes[3]: 
                this.setState('features')
                this.buildFeatureControls()
                break;
            case this.settings.toolBoxes[4]: 
                this.setState('colors')
                this.buildColorControls()
                break;
            default:
                break;
        }
    }
    setState(props){
        this.controls.currentState[props] ??= {}
    }
    buildInstanceSelector(){
        const toolboxHeader = document.createElement('toolbox-header')
        toolboxHeader.controls = this.controls
        this.appendChild(toolboxHeader)
    }

    buildBasicControls(){
        for(const [key, value] of Object.entries(this.settings.basicControls)){
            const inputRange = document.createElement('input-range')
            inputRange.name = key
            inputRange.data = value
            inputRange.controls = this.controls
            this.appendChild(inputRange)
        }
    }
    
    buildVariableControls(){
        
        let currentSpeedIdx = 1
        this.controls.currentState.playSpeed = this.settings.playSpeeds[currentSpeedIdx];
        this.controls.currentState.globalPlaying = 0;
        
        const animationPlayer = document.createElement('div')
        const playAllBtn = document.createElement('button')
        const setSpeedBtn = document.createElement('button')

        for(const axis of Object.values(this.font.variationAxes)){
            const variableInputRange = document.createElement('variableinput-range')
            variableInputRange.axis = axis
            variableInputRange.controls = this.controls;
            variableInputRange.globalPlayBtn = playAllBtn;
            this.appendChildren(variableInputRange)
        }

        playAllBtn.textContent = 'Play All'
        setSpeedBtn.textContent = `×${this.controls.currentState.playSpeed}`
        playAllBtn.classList.add("paused")

        playAllBtn.addEventListener('click', (ev)=>{
            if(this.controls.currentState.globalPlaying === this.font.variationAxes.length){
                ev.target.textContent = 'Play All'
                ev.target.classList.replace("paused", "playing")
                this.querySelectorAll('variableinput-range').forEach(el=>{
                    el.stopAnimation()
                })
            }else{
                this.querySelectorAll('variableinput-range').forEach(el=>{
                    el.playAnimation();
                })
            }
        })
        

        setSpeedBtn.addEventListener('click', (ev)=>{
            currentSpeedIdx = ++currentSpeedIdx%4
            this.controls.currentState.playSpeed = this.settings.playSpeeds[currentSpeedIdx]
            this.querySelectorAll('variableinput-range').forEach(el=>{
                el.playSpeed = this.controls.currentState.playSpeed
                ev.target.textContent = `×${this.controls.currentState.playSpeed}`
            })
        })

        animationPlayer.appendChildren(playAllBtn, setSpeedBtn)
        animationPlayer.classList.add("animationPlayer", "rangeHeader", "flex")

        this.appendChild(animationPlayer)
    }

    buildFeatureControls(){
        for(const feature of this.settings.featureLists){
            if (feature.tag === "locl"){
                this.controls.currentState.features??={}
                this.controls.currentState.features.locl = "";
                userText.style.webkitLocale = `"${feature.selectedLanguage.htmlTag}"`||"auto"
                userText.style.fontLanguageOverride  = `"${feature.selectedLanguage.tag}"`||"auto"
            }
            const featureBlock = document.createElement('feature-block')
            featureBlock.feature = feature
            featureBlock.controls = this.controls
            this.appendChild(featureBlock)
        }
    }
    buildColorControls(){
        for (const [key, value]  of Object.entries(this.settings.colorData)){
            const colorBlock = document.createElement('color-block')
            colorBlock.name = key
            colorBlock.data = value
            colorBlock.controls = this.controls
            this.appendChild(colorBlock)
        }
    }
}


export default class ControlBar extends HTMLElement{
    constructor(){
        super()
        this.font = currentFont
        this.controls = new Settings(this.font);
        this.controls.parent = this;
        this.id = 'control-bar'
    }
    connectedCallback(){
        this.updateFont()
    }
    updateFont(){
        this.setData()
        this.initializeUI()
    }
    setData(){
        this.font = currentFont
        console.log(this.font)
        this.controls.updateData(currentFont)
    }
    initializeUI(){
        this.removeChild()
        for (let i in this.controls.settings.toolBoxes){
            if (!this.controls.settings.toolBoxCheckers[i]){
                continue;
            }
            const toolBox = new ToolBox() ;
            toolBox.controls = this.controls;
            toolBox.name = this.controls.settings.toolBoxes[i];
            this.appendChild(toolBox);
        }
    }
    removeChild(){
        this.innerHTML= ''
    }
}

window.customElements.define('toolbox-header', ToolboxHeader)
window.customElements.define('input-range', InputRange)
window.customElements.define('variableinput-range', VariableInputRange)
window.customElements.define('feature-block', FeatureBlock)
window.customElements.define('color-block', ColorBlock)
window.customElements.define('tool-box', ToolBox)
window.customElements.define('control-bar', ControlBar)
