export interface JsonFragmentType {
  readonly name?: string;
  readonly indexed?: boolean;
  readonly type?: string;
  // readonly internalType?: any; // @TODO: in v6 reduce type
  readonly components?: ReadonlyArray<JsonFragmentType>;
}

export interface JsonFragment {
  readonly name?: string;
  readonly type?: string;

  readonly anonymous?: boolean;

  readonly payable?: boolean;
  readonly constant?: boolean;
  readonly stateMutability?: string;

  readonly inputs?: ReadonlyArray<JsonFragmentType>;
  readonly outputs?: ReadonlyArray<JsonFragmentType>;

  readonly gas?: string;
};

// AST Node parser state
export type ParseState = {
  allowArray?: boolean,
  allowName?: boolean,
  allowParams?: boolean,
  allowType?: boolean,
  readArray?: boolean,
};

// AST Node
export type ParseNode = {
  parent?: any,
  type?: string,
  name?: string,
  state?: ParseState,
  indexed?: boolean,
  components?: Array<ParseNode>
};
