interface MessageType {
    type: string;
}

export abstract class Query implements MessageType {
    public readonly type: string;

    protected constructor(type: string) {
        this.type = type;
    }
}

export abstract class Command implements MessageType {
    public readonly type: string;

    protected constructor(type: string) {
        this.type = type;
    }
}

export function createResolver<T>() {
    let resolver: (r: T | undefined) => void;
    const promise = new Promise<T | undefined>((resolve) => {
        resolver = (response: T | undefined) => {
            resolve(response);
        };
    });

    function wait() {
        return promise;
    }

    function done(data: T | undefined) {
        resolver(data);
    }

    return { wait, done };
}

export class ClipboardQuery extends Query {
    public readonly text: string;

    constructor(text: string) {
        super("ClipboardQuery");
        this.text = text;
    }
}

export class GetClipboardCommand extends Command {
    constructor() {
        super("GetClipboardCommand");
    }
}

export class SetClipboardCommand extends Command {
    public readonly text: string;

    constructor(text: string) {
        super("SetClipboardCommand");
        this.text = text;
    }
}
