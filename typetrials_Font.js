import opentypeLanguageTags from "./opentypeLanguageTags";
import { getOpenTypeFeatureName } from "./opentypeFeatureNames";

export default class Font {
  constructor(font, url, fileName, cmsdata) {
    // console.log(font);
    this.version = 0;
    this.url = url;
    this.fileName = fileName;
    this.font = font;
    this.cmsdata = cmsdata;
    this.processFont();
  }

  serialize() {
    // eslint-disable-next-line no-unused-vars
    const { font, ...obj } = this;
    return obj;
  }

  async processFont() {
    this.getNames();
    this.getFeatures();
    this.getPresets();
    this.getGlyphs();
    this.generateFontFace();

    const _this = this;

    if(this.url.indexOf('blob') >= 0) {
      // console.log('this is a blob font, should rename url');
      // console.log(this.font);
      // files.forEach(file => {
        // console.log(this.url);
        let blob = await fetch(this.url).then(r => r.blob());
        var reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
          // console.log(`FILEREADER RESULT ${reader.result}`);
          _this.url = reader.result;
          console.log(_this);
        //   file.url = reader.result;
        };
      // });
    }
  }

  getPresets(){
    const font = this.font;
    this.presets = [];
    if (font && font.tables.fvar && font.tables.fvar.instances) {
      this.presets = font && font.tables.fvar && font.tables.fvar.instances;
    }

    if(!this.selectedPreset) this.selectedPreset = this.presets[0];

    var t = this;
    this.presets.forEach(function(p){
      if(Object.keys(p.name).length === 0){
        p.name.en = 'Regular';
      }
      if(p.name.en == 'Regular'){
        t.selectedPreset = p;
      }
    });

// ital: 0
// slnt: 0
// title: "Regular"
// wdth: 100
// wght: 400

    // this.selectedPreset = null;
    // if(this.cmsdata && this.cmsdata.presets.length>0){
    //   this.presets = [];
    //   for(var i=0; i<this.cmsdata.presets.length; i++){
    //     this.presets[i] = this.cmsdata.presets[i];
    //   }
    //   this.selectedPreset = this.cmsdata.presets[i];
    //   // console.log('yes presets', this.presets);
    // }
    // console.log(this.presets);
  }

  getNames() {
    const font = this.font;
    const names = font.names;
    this.family = (names.preferredFamily && names.preferredFamily.en) || names.fontFamily.en;
    this.originalFamily = this.family;
    if (this.version) {
      this.family += `-${this.version}`;
    }
    console.log(names);

    this.style = (names.preferredSubfamily && names.preferredSubfamily.en) || (names.fontSubfamily && names.fontSubfamily.en) || (names.fontFamily && names.fontFamily.en);

    this.cssFamily = this.family + '-' + this.style;
    this.cssStyle = /(italic|oblique)/gi.test(this.style) ? "italic" : "normal";
    this.cssWeight = font.tables.os2.usWeightClass;

    if(this.cmsdata) {
      this.displayName = this.cmsdata.font_name || this.originalFamily;
    } else {
      this.displayName = `${this.originalFamily}`;
      // this.displayName = `${this.originalFamily} ${this.style} ${this.version ? `(${this.version})` : ''}`;
    }
  }

  getGlyphs() {
    const font = this.font;
    // this.characters = Object.keys(font.tables.cmap.glyphIndexMap).map(unicode => String.fromCharCode(unicode));
    const glyphs = Object.keys(font.glyphs.glyphs)
      .map(k => font.glyphs.glyphs[k])
      .filter(g => g.unicode)
      .map(g => String.fromCharCode(g.unicode));
    // console.log(glyphs);
    this.characters = glyphs;
  }

  getFeatures() {
    const font = this.font;
    const names = font.names;
    const gpos = font.tables.gpos || {};
    const gsub = font.tables.gsub || {};

    const languageSet = new Set(
      [...(gpos.scripts || []), ...(gsub.scripts || [])]
        .flatMap(s => s.script.langSysRecords).map(lsr => lsr.tag)
    );
    const loclLanguages = Array.from(languageSet)
    .map(tag => {
      // tags are four characters, last most commonly space
        const language = opentypeLanguageTags.find(l => l.opentypeTag === tag);
        const name = language ? language.name : tag;
        const htmlTag = language ? language.htmlTag : tag.toLowerCase();
        return ({ tag, name, htmlTag });
      })
      .sort((a, b) => a.name > b.name);
    loclLanguages.unshift({ tag: '', htmlTag: '', name: 'automatic' });

    const stylisticSetNames = Object.getOwnPropertyNames(names)
      .filter(p => /\d+/.test(p))
      .map(p => names[p].en);
    let i = 0;
    const getStylisticSetName = function () {
      return stylisticSetNames[i++];
    };

    this.gposFeatures = [];
    (gpos.features || []).forEach(f => {
      const duplicate = this.gposFeatures.find(ff => ff.tag == f.tag);
      if (!duplicate) {
        const feature = {
          tag: f.tag,
          name: getOpenTypeFeatureName(f.tag),
        };
        this.gposFeatures.push(feature);
      }
    });

    this.gsubFeatures = [];
    (gsub.features || []).forEach(f => {
      const duplicate = this.gsubFeatures.find(ff => ff.tag == f.tag);
      if (!duplicate) {
        const feature = {
          tag: f.tag,
          name: getOpenTypeFeatureName(f.tag),
          // uiName: f.feature.uiName,
        };

        if (f.tag == "locl") {
          feature.languages = loclLanguages;
          feature.selectedLanguage = loclLanguages[0];
        } else if (/ss\d\d/.test(f.tag)) {
          const uiName =  f.feature.uiName;
          feature.uiName = uiName && uiName['en'];
        } else if (/cv\d\d/.test(f.tag)) {
          const uiName =  f.feature.featUiLabelName;
          feature.uiName = uiName && uiName['en'];
          console.log(feature.uiName)
        }
        this.gsubFeatures.push(feature);
      }
    });

    this.variationAxes = [];
    if (font && font.tables.fvar && font.tables.fvar.axes) {
      this.variationAxes = font && font.tables.fvar && font.tables.fvar.axes;
    }
  }

  generateFontFace({ family, style, weight } = {}) {
    this.fontFace = `
      @font-face {
        src: url('${this.url}');
        font-family: "${family || this.cssFamily}";
        ${ this.variationAxes.length === 0 ? 'font-weight: bold' : ''};  // prevent fake bold, allow for automatic weight in Variable fonts
        // font-style: ${style || this.cssStyle};  // hmmm...
      }
    `;
    return this.fontFace;
  }

  bumpVersion(value) {
    if (value) {
      this.version = value;
    }
    else {
      this.version++;
    }
    this.processFont();
  }
}
