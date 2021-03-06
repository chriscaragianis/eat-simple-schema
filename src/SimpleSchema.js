import "babel-polyfill"
import _ from 'lodash';
//import SimpleSchema from 'meteor/aldeed:meteor-simple-schema

export default class SimpleSchema {
  constructor(schema) {
    this.schema = schema;
    this.context = {};
  }

  ind(x) {return Array(x + 1).join(' ');}

  line(t, content) {
    return `${this.ind(t)}${content}\n`;
  }

  getSimpleType(key, typeFun, t) {
    if (typeFun.name == 'Number') {
      return this.line(t, `type: ${this.schema[key].decimal ? `number` : `integer`}`);
    }
    if (typeFun.name == 'Date') {
      let out = this.line(t, `type: string`);
      out += this.line(t, `format: date-time`);
      return out;
    }
    else {
      return this.line(t, `type: ${_.toLower(typeFun.name)}`);
    }
  }

  getArrayType(key, typeFun, t) {
    let out = ``
    out += this.line(t, `type: array`);
    out += this.line(t, `items:`);
    if (typeFun[0].name =='Object') {
      out += this.getBlackboxType(key, t + 2)
    }
    else {
      out += this.getPropType(key, typeFun[0], t + 2);
    }
    return out;
  }

  //TODO rename this function
  getBlackboxType(key, t) {
    const typeObj = {};
    _.keys(this.schema).forEach((_key) => {
      if(_key.includes(key + '.')) {
        typeObj[_key.replace(/([^\.]|.(?=\$))*\./, '')] = this.schema[_key];
      }
    });
    return (new SimpleSchema(typeObj)).toYaml(t - 2);
  }

  getPropType(key, typeFun, t) {

    let simpleTypes = ['String', 'Number', 'Boolean', 'Date'];

    // empty
    if(!typeFun) {
      return ``
    }

    // array
    if(typeFun[0]) {
      return this.getArrayType(key, typeFun, t);
    }

    // simple
    if (_.indexOf(simpleTypes, typeFun.name) >= 0) {
      return this.getSimpleType(key, typeFun, t);
    }

    // $ref
    if (typeFun.schema) {
      return this.line(t, `$ref: "#/definitions/${typeFun.swag_name}"`);
    }

    // object literal
    // TODO rename the getBlackboxType function
    if (typeFun.name == 'Object') {
      return this.getBlackboxType(key, t);
    }
  }

  getPropLabel(key, t) {
    if (this.schema[key].label) {
      return this.line(t, `description: ${this.schema[key].label.replace(/:/g, ';')}`);
    }
    return this.line(t, `description: No description provided`);
  }

  // schema, string => template literal
  getProp(key, t) {
    if (!this.schema[key]) { //skip if prop is empty
      return ``;
    }
    let out = ``;
    out += this.getPropType(key, this.schema[key].type, t);
    out += this.getPropLabel(key, t);
    return out;
  }

  // schema => template literal
  getProps(t) {
    let out = this.line(t, `properties:`);
    _.keys(this.schema).forEach((key) => {
      if (!key.includes('.') && !_.has(this.schema[key], 'blackbox')) {
        out += this.line(t + 2, `${key}:`);
        out += this.getProp(key, t + 4);
      }
    });
    return out;
  }

  getReq(t) {
    const reqs = [];
    let out = ``;
    _.keys(this.schema).forEach((key) => {
      if (!this.schema[key] || key.includes('.')) { //skip if prop is empty or has dot
        return ``;
      }
      if (!this.schema[key].optional) {
        reqs.push(key);
      }
    });
    if (reqs.length > 0) {
      out += this.line(t, `required:`);
      reqs.forEach((key) => {
        out += this.line(t, `- ${key}`);
      });
    }
    return out;
  }

  // schema => template literal
  toYaml(t) {
    let out = ``;
    if(this.swag_name) {
      out += this.line(t, `${this.swag_name}:`);
    }
    out += this.line(t + 2, `type: object`);
    out += this.getProps(t + 2);
    out += this.getReq(t + 2);
    return out;
  }

  //fakery
  static RegEx() {
    return {Url: 'urlregex'};
  }

  static extendOptions(obj) {};
  static messages(obj) {};
}

