const mainEl = document.getElementById('content')

export default class Settings {
    constructor(opentypeFont){
        this.font = opentypeFont
        this.updateData(opentypeFont)
        this.currentState = {};
        
    }
    updateFontCSS(){
        for (const [key, value] of Object.entries(this.currentState.basics)){
            userText.style[key] = `${value[0]}${value[1]}`
        }
    }
    updateVariationCSS(){
        const varCssStringRaw = JSON.stringify(this.currentState.variations)
        const varCssString = varCssStringRaw.replaceAll(':',' ').slice(1,-1)
        userText.style.fontVariationSettings = varCssString;
    }
    updateFeatureCSS(){
        const feaCssStringRaw = JSON.stringify(this.currentState.features)
        const feaCssString = feaCssStringRaw.replaceAll('false',0).replaceAll('true','').replaceAll(':',' ').slice(1,-1)
        userText.style.fontFeatureSettings = feaCssString;
    }
    updateColor(){
        for (const [key, value] of Object.entries(this.currentState.colors)){
            mainEl.style[key] = value
        }
    }
    updateInstance(){
        const coordinates = this.currentState.instance[0].coordinates;
        this.currentState.variations = coordinates
        for (const [axis, value] of Object.entries(coordinates)){
            const inputs = this.parent.querySelectorAll(`.${axis}input`)
            for (const input of inputs){
                input.value =  Math.round(value * 100) / 100;
                this.currentState.variations[axis] ??= value;
            }
            this.updateVariationCSS()
        }
    }
    updateData(opentypeFont){
        this.font = opentypeFont;
        this.fileName = opentypeFont.fileName;
        this.variationAxes = this.font.variationAxes;
        this.gsubFeatures = this.font.gsubFeatures;
        this.gposFeatures = this.font.gposFeatures;
        this.featureLists = [this.font.gsubFeatures].concat([this.font.gposFeatures]).flatMap(e=>e);
        this.settings = {
            // textKinds,
            playSpeeds : [0.5, 1, 1.5, 2],
            featureLists : this.featureLists,
            toolBoxes : ['Typeface', 'Basic Controls', 'Variable Settings','Opentype Features',  'Colors'],
            toolBoxCheckers : [true, true, this.variationAxes[0], this.featureLists[0],  true],
            basicControls : {
                "Size": {min: 10, max:300, default:100, step:1, prop: "fontSize", unit:"px"}, 
                "Line Height": {min: 0, max:2, default:1.2, step:0.01, prop: "lineHeight"}, 
                "Letter Spacing": {min: -1, max:1, default:0, step:0.01, prop: "letterSpacing", unit:"rem"}
            },
            capTags: ["smcp", "c2sc", "pcap", "c2pc"],
            figureTags: ["pnum", "tnum", "lnum", "onum"],
            figureHeights: [
                { value: "default", label: "default" },
                { value: "lnum", label: "lining" },
                { value: "onum", label: "oldstyle" },
            ],
            figureHeight: "default",
            figureWidths: [
                { value: "default", label: "default" },
                { value: "pnum", label: "proportional" },
                { value: "tnum", label: "tabular" },
            ],
            figureWidth: "default",
            numberTags: ["sups", "subs", "numr", "dnom", "frac", "zero"],
            stylisticSetTags: Array(20)
                .fill(0)
                .map((_, i) => `ss${(i + 1).toString().padStart(2, "0")}`),
            characterVariantsTags: Array(99)
                .fill(0)
                .map((_, i) => `cv${(i + 1).toString().padStart(2, "0")}`),
            loclTags: ["locl"],
            loclSelectKeys: {
                class: "class",
                label: "name",
                image: "image",
            },
            colorData: {
                "Typeface":{prop: "color", defaultValue:"000000"},
                "Background": {prop: "backgroundColor", defaultValue:"FFFFFF"}},
        }
    }
}
