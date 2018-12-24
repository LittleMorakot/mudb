import { MuReadStream, MuWriteStream } from '../stream';
import { MuString } from './_string';

export class MuUTF8 extends MuString {
    constructor (identity?:string) {
        super(identity || '', 'utf8');
    }

    public diff (base:string, target:string, stream:MuWriteStream) {
        if (base !== target) {
            stream.grow(4 + 2 * target.length);
            stream.writeString(target);
            return true;
        }
        return false;
    }

    public patch (base:string, stream:MuReadStream) {
        return stream.readString();
    }
}
