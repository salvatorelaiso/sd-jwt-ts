import { SDMap } from './SDMap.js';
export class SDField {
    sd;
    children;
    constructor(sd, children = null) {
        this.sd = sd;
        this.children = children;
    }
    toJSON() {
        return JSON.stringify({
            sd: this.sd,
            children: this.children ? this.children.toJSON() : null,
        });
    }
    static fromJSON(json) {
        const { sd, children } = JSON.parse(json);
        return new SDField(sd, children ? SDMap.fromJSON(children) : null);
    }
}
//# sourceMappingURL=SDField.js.map