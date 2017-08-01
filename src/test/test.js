import nsoap from "../nsoap";
import should from "should";

const app = {
  index() {
    return "Home page!";
  },
  about() {
    return "NSOAP Test Suite";
  },
  static: "NSOAP Static File",
  unary(arg) {
    return arg + 10;
  },
  binary(x, y) {
    return x + y;
  },
  namespace: {
    binary(x, y) {
      return x + y;
    }
  },
  nested: {
    namespace: {
      binary(x, y) {
        return x + y;
      }
    }
  },
  json(input) {
    return input.x + 20;
  },
  throw(a) {
    throw new Error("Exception!");
  },
  chainAdder1(x) {
    return {
      chainAdder2(y) {
        return x + y;
      }
    };
  },
  infer(_bool, _num, _str) {
    return {
      _bool,
      _num,
      _str
    };
  },
  promiseToAdd(x, y) {
    return Promise.resolve(x + y);
  },
  functionOnPromise(x, y) {
    return Promise.resolve({
      adder(z) {
        return x + y + z;
      }
    });
  },
  defaultFunction(x, y) {
    return {
      index() {
        return x + y;
      }
    };
  }
};

function getMockHandler() {
  let result;

  return {
    then(_result) {
      result = _result;
    },
    getResult() {
      return result;
    }
  };
}

describe("NSOAP", () => {
  it("Calls a parameter-less function", async () => {
    const handler = getMockHandler();
    await nsoap(app, "about", [], {}, handler.then);
    handler.getResult().should.equal("NSOAP Test Suite");
  });

  it("Gets the value of a property", async () => {
    const handler = getMockHandler();
    await nsoap(app, "static", [], {}, handler.then);
    handler.getResult().should.equal("NSOAP Static File");
  });

  it("Calls a unary function", async () => {
    const handler = getMockHandler();
    await nsoap(app, "unary(10)", [], {}, handler.then);
    handler.getResult().should.equal(20);
  });

  it("Throws an exception", async () => {
    const handler = getMockHandler();
    const result = nsoap(app, "throw(10)", [], {}, handler.then);
    return result.then(
      () => {
        throw new Error("Exception was expected but not thrown.");
      },
      err => {}
    );
  });

  it("Calls a binary function", async () => {
    const handler = getMockHandler();
    await nsoap(app, "binary(10,20)", [], {}, handler.then);
    handler.getResult().should.equal(30);
  });

  it("Calls a unary function with variables", async () => {
    const handler = getMockHandler();
    await nsoap(app, "unary(x)", [{ x: 10 }], {}, handler.then);
    handler.getResult().should.equal(20);
  });

  it("Calls a binary function with variables", async () => {
    const handler = getMockHandler();
    await nsoap(app, "binary(x,y)", [{ x: 10, y: 20 }], {}, handler.then);
    handler.getResult().should.equal(30);
  });

  it("Calls a binary function with literals and variables", async () => {
    const handler = getMockHandler();
    await nsoap(app, "binary(x,20)", [{ x: 10 }], {}, handler.then);
    handler.getResult().should.equal(30);
  });

  it("Calls a binary function in a namespace", async () => {
    const handler = getMockHandler();
    await nsoap(app, "namespace.binary(10,20)", [], {}, handler.then);
    handler.getResult().should.equal(30);
  });

  it("Calls a binary function in a nested namespace", async () => {
    const handler = getMockHandler();
    await nsoap(app, "nested.namespace.binary(10,20)", [], {}, handler.then);
    handler.getResult().should.equal(30);
  });

  it("Accepts JSON arguments", async () => {
    const handler = getMockHandler();
    await nsoap(app, "json(obj)", [{ obj: { x: 10 } }], {}, handler.then);
    handler.getResult().should.equal(30);
  });

  it("Adds parenthesis if omitted", async () => {
    const handler = getMockHandler();
    await nsoap(app, "about", [], {}, handler.then);
    handler.getResult().should.equal("NSOAP Test Suite");
  });

  it("Calls the default function", async () => {
    const handler = getMockHandler();
    await nsoap(app, "", [], { index: "index" }, handler.then);
    handler.getResult().should.equal("Home page!");
  });

  it("Calls chained functions", async () => {
    const handler = getMockHandler();
    await nsoap(app, "chainAdder1(10).chainAdder2(20)", [], {}, handler.then);
    handler.getResult().should.equal(30);
  });

  it("Infers types", async () => {
    const handler = getMockHandler();
    await nsoap(app, "infer(true, 20, Hello)", [], {}, handler.then);
    const result = handler.getResult();
    (typeof result._bool).should.equal("boolean");
    (typeof result._num).should.equal("number");
    (typeof result._str).should.equal("string");
  });

  it("Is Case-sensitive", async () => {
    const handler = getMockHandler();
    await nsoap(app, "unary(x)", [{ X: 100, x: 10 }], {}, handler.then);
    handler.getResult().should.equal(20);
  });

  it("Resolves a Promise", async () => {
    const handler = getMockHandler();
    await nsoap(app, "promiseToAdd(x,y)", [{ x: 10, y: 20 }], {}, handler.then);
    handler.getResult().should.equal(30);
  });

  it("Calls a function on the resolved value of a Promise", async () => {
    const handler = getMockHandler();
    await nsoap(
      app,
      "functionOnPromise(x,y).adder(100)",
      [{ x: 10, y: 20 }],
      {},
      handler.then
    );
    handler.getResult().should.equal(130);
  });

  it("Calls default function on object", async () => {
    const handler = getMockHandler();
    await nsoap(
      app,
      "defaultFunction(10,20)",
      [],
      { index: "index" },
      handler.then
    );
    handler.getResult().should.equal(30);
  });

  it("Passes additional args to handler", async () => {
    const handler = getMockHandler();
    await nsoap(
      app,
      "defaultFunction(10)",
      [],
      { index: "index", args: [20] },
      handler.then
    );
    handler.getResult().should.equal(30);
  });
});
