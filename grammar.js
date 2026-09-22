/**
 * @file Tree-sitter grammar for MyBatis and iBATIS mapper files.
 * @author ishi-o <ishio.liu@outlook.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const XML_NAME = new RustRegex("[A-Za-z_:][A-Za-z0-9_.:-]*");

/** @type {readonly string[]} */
const SQL_KEYWORDS = [
  "add",
  "all",
  "alter",
  "and",
  "as",
  "asc",
  "between",
  "by",
  "call",
  "case",
  "column",
  "create",
  "cross",
  "current_timestamp",
  "default",
  "delete",
  "desc",
  "distinct",
  "drop",
  "else",
  "end",
  "exists",
  "foreign",
  "from",
  "full",
  "group",
  "having",
  "in",
  "inner",
  "insert",
  "into",
  "is",
  "join",
  "key",
  "left",
  "like",
  "limit",
  "not",
  "null",
  "offset",
  "on",
  "or",
  "order",
  "outer",
  "primary",
  "references",
  "returning",
  "right",
  "select",
  "set",
  "table",
  "then",
  "truncate",
  "union",
  "unique",
  "update",
  "values",
  "when",
  "where",
  "with",
];

/**
 * @param {RuleOrLiteral} rule
 * @param {boolean} requireFirst
 * @returns {RuleOrLiteral}
 */
function commaList(rule, requireFirst = true) {
  const sequence = seq(rule, repeat(seq(",", rule)));
  return requireFirst ? sequence : optional(sequence);
}

/**
 * @param {RuleOrLiteral} rule
 * @returns {SeqRule}
 */
function parenList(rule) {
  return seq("(", commaList(rule), ")");
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {string} name
 * @returns {SeqRule}
 */
function openTag($, name) {
  return seq("<", alias(name, $.Name), repeat($.Attribute), ">");
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {string} name
 * @returns {SeqRule}
 */
function closeTag($, name) {
  return seq("</", alias(name, $.Name), ">");
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {string} name
 * @param {RuleOrLiteral} body
 * @returns {ChoiceRule}
 */
function taggedElement($, name, body) {
  return choice(
    seq(openTag($, name), body, closeTag($, name)),
    seq("<", alias(name, $.Name), repeat($.Attribute), "/>"),
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @returns {ChoiceRule}
 */
function dynamicContent($) {
  return choice(
    $.IfElem,
    $.ChooseElem,
    $.WhenElem,
    $.OtherwiseElem,
    $.TrimElem,
    $.WhereElem,
    $.SetElem,
    $.ForeachElem,
    $.BindElem,
    $.DynamicSqlElem,
    $.IterateElem,
    $.IsNotEmptyElem,
    $.IsEmptyElem,
    $.IsEqualElem,
    $.IsNotEqualElem,
    $.IsGreaterThanElem,
    $.IsGreaterEqualElem,
    $.IsLessThanElem,
    $.IsLessEqualElem,
    $.IsNotNullElem,
    $.IsNullElem,
    $.IsPropertyAvailableElem,
    $.IsNotPropertyAvailableElem,
    $.IsParameterPresentElem,
    $.IsNotParameterPresentElem,
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @returns {ChoiceRule}
 */
function mapperContent($) {
  return choice(
    $.statement,
    $.from,
    $.where,
    $.select_expression,
    $.SelElem,
    $.InsElem,
    $.UpdElem,
    $.DelElem,
    $.ProcElem,
    $.StmtElem,
    $.SelKeyElem,
    $.SqlElem,
    $.IncludeElem,
    dynamicContent($),
    $.CDSect,
    $.Comment,
    $.PI,
    $.element,
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @returns {ChoiceRule}
 */
function sqlFragmentContent($) {
  return choice(
    $.select_expression,
    $.invocation,
    $.list,
    $.keyword_and,
    $.keyword_or,
    $.IncludeElem,
    dynamicContent($),
    $.CDSect,
    $.Comment,
    $.element,
  );
}

module.exports = grammar({
  name: "mybatis",
  extras: ($) => [new RustRegex("[ \\t\\r\\n]+"), $.comment],
  word: ($) => $._identifier,
  conflicts: ($) => [
    [$.field, $._qualified_field],
    [$.object_reference, $._qualified_field],
    [$.term],
    [$.join],
    [$._select_statement],
    [$._update_statement],
    [$.relation],
    [$._delete_statement],
  ],

  rules: {
    document: ($) =>
      repeat(
        choice(
          $.XMLDecl,
          $.doctypedecl,
          $.PI,
          $.Comment,
          $.Mapper,
          $.SqlMap,
          $.element,
        ),
      ),

    XMLDecl: (_) =>
      token(
        seq(
          "<?xml",
          repeat(
            choice(new RustRegex("[^?]"), seq("?", new RustRegex("[^?]"))),
          ),
          "?>",
        ),
      ),
    PI: (_) =>
      token(
        seq(
          "<?",
          repeat(
            choice(new RustRegex("[^?]"), seq("?", new RustRegex("[^?]"))),
          ),
          "?>",
        ),
      ),
    doctypedecl: ($) =>
      seq("<", "!DOCTYPE", $.Name, optional($.ExternalID), ">"),
    ExternalID: ($) =>
      choice(
        seq("SYSTEM", $.SystemLiteral),
        seq("PUBLIC", $.PubidLiteral, $.SystemLiteral),
      ),
    PubidLiteral: (_) => token(new RustRegex("\"-[^\"]*\"|'-[^']*'")),
    SystemLiteral: ($) => seq('"', $.URI, '"'),
    URI: (_) => token(new RustRegex('[^"]*')),

    Mapper: ($) => seq($.MapperSTag, repeat(mapperContent($)), $.MapperETag),
    MapperSTag: ($) => openTag($, "mapper"),
    MapperETag: ($) => closeTag($, "mapper"),
    SqlMap: ($) => seq($.SqlMapSTag, repeat(mapperContent($)), $.SqlMapETag),
    SqlMapSTag: ($) => openTag($, "sqlMap"),
    SqlMapETag: ($) => closeTag($, "sqlMap"),

    SelElem: ($) => taggedElement($, "select", repeat(mapperContent($))),
    InsElem: ($) => taggedElement($, "insert", repeat(mapperContent($))),
    UpdElem: ($) => taggedElement($, "update", repeat(mapperContent($))),
    DelElem: ($) => taggedElement($, "delete", repeat(mapperContent($))),
    ProcElem: ($) =>
      taggedElement(
        $,
        "procedure",
        choice($._procedure_call, repeat(sqlFragmentContent($))),
      ),
    StmtElem: ($) => taggedElement($, "statement", repeat(mapperContent($))),
    SelKeyElem: ($) => taggedElement($, "selectKey", repeat(mapperContent($))),
    SqlElem: ($) => taggedElement($, "sql", repeat(mapperContent($))),
    IncludeElem: ($) => taggedElement($, "include", optional($.element)),

    IfElem: ($) => taggedElement($, "if", repeat(sqlFragmentContent($))),
    ChooseElem: ($) =>
      taggedElement($, "choose", repeat(choice($.WhenElem, $.OtherwiseElem))),
    WhenElem: ($) => taggedElement($, "when", repeat(sqlFragmentContent($))),
    OtherwiseElem: ($) =>
      taggedElement($, "otherwise", repeat(sqlFragmentContent($))),
    TrimElem: ($) => taggedElement($, "trim", repeat(sqlFragmentContent($))),
    WhereElem: ($) => taggedElement($, "where", repeat(sqlFragmentContent($))),
    SetElem: ($) => taggedElement($, "set", repeat(sqlFragmentContent($))),
    ForeachElem: ($) =>
      taggedElement($, "foreach", repeat(sqlFragmentContent($))),
    BindElem: ($) => taggedElement($, "bind", repeat(sqlFragmentContent($))),
    DynamicSqlElem: ($) =>
      taggedElement($, "dynamic", repeat(sqlFragmentContent($))),
    IterateElem: ($) =>
      taggedElement($, "iterate", repeat(sqlFragmentContent($))),
    IsNotEmptyElem: ($) =>
      taggedElement($, "isNotEmpty", repeat(sqlFragmentContent($))),
    IsEmptyElem: ($) =>
      taggedElement($, "isEmpty", repeat(sqlFragmentContent($))),
    IsEqualElem: ($) =>
      taggedElement($, "isEqual", repeat(sqlFragmentContent($))),
    IsNotEqualElem: ($) =>
      taggedElement($, "isNotEqual", repeat(sqlFragmentContent($))),
    IsGreaterThanElem: ($) =>
      taggedElement($, "isGreaterThan", repeat(sqlFragmentContent($))),
    IsGreaterEqualElem: ($) =>
      taggedElement($, "isGreaterEqual", repeat(sqlFragmentContent($))),
    IsLessThanElem: ($) =>
      taggedElement($, "isLessThan", repeat(sqlFragmentContent($))),
    IsLessEqualElem: ($) =>
      taggedElement($, "isLessEqual", repeat(sqlFragmentContent($))),
    IsNotNullElem: ($) =>
      taggedElement($, "isNotNull", repeat(sqlFragmentContent($))),
    IsNullElem: ($) =>
      taggedElement($, "isNull", repeat(sqlFragmentContent($))),
    IsPropertyAvailableElem: ($) =>
      taggedElement($, "isPropertyAvailable", repeat(sqlFragmentContent($))),
    IsNotPropertyAvailableElem: ($) =>
      taggedElement($, "isNotPropertyAvailable", repeat(sqlFragmentContent($))),
    IsParameterPresentElem: ($) =>
      taggedElement($, "isParameterPresent", repeat(sqlFragmentContent($))),
    IsNotParameterPresentElem: ($) =>
      taggedElement($, "isNotParameterPresent", repeat(sqlFragmentContent($))),

    statement: ($) =>
      choice(
        $._select_statement,
        $._insert_statement,
        $._update_statement,
        $._delete_statement,
        $._truncate_statement,
      ),
    _procedure_call: ($) => seq("{", $.keyword_call, $.invocation, "}"),
    _select_statement: ($) =>
      prec(
        2,
        seq($.select, optional($.from), optional($.where), optional(";")),
      ),
    select: ($) =>
      seq(
        $.keyword_select,
        optional($.keyword_distinct),
        choice($.select_expression, $.IncludeElem),
      ),
    select_expression: ($) => commaList($.term),
    term: ($) =>
      seq(
        field("value", choice($.all_fields, $._expression)),
        optional($._alias),
      ),
    all_fields: ($) => seq(optional(seq($.object_reference, ".")), "*"),
    _alias: ($) => seq(optional($.keyword_as), field("alias", $.identifier)),
    from: ($) => seq($.keyword_from, commaList($.relation), repeat($.join)),
    relation: ($) => seq($.object_reference, optional($._alias)),
    join: ($) =>
      seq(
        optional(
          choice(
            $.keyword_left,
            $.keyword_right,
            $.keyword_inner,
            $.keyword_full,
          ),
        ),
        $.keyword_join,
        $.relation,
        optional($.join),
        optional(seq($.keyword_on, $._expression)),
      ),
    where: ($) => seq($.keyword_where, $._expression),

    _insert_statement: ($) => seq($.insert, optional(";")),
    insert: ($) =>
      seq(
        $.keyword_insert,
        optional($.keyword_into),
        $.object_reference,
        optional(alias($._column_list, $.list)),
        $.keyword_values,
        commaList($.list),
      ),
    _column_list: ($) => parenList(alias($._column, $.column)),
    _column: ($) => choice($.identifier, alias($._literal_string, $.literal)),

    _update_statement: ($) => seq($.update, optional($.where), optional(";")),
    update: ($) =>
      seq($.keyword_update, $.relation, $.keyword_set, commaList($.assignment)),
    assignment: ($) =>
      seq(
        field("left", alias($._qualified_field, $.field)),
        "=",
        field("right", $._expression),
      ),

    _delete_statement: ($) =>
      seq(
        $.delete,
        alias(seq($._delete_from, optional($.where)), $.from),
        optional(";"),
      ),
    delete: ($) => $.keyword_delete,
    _delete_from: ($) => seq($.keyword_from, $.object_reference),
    _truncate_statement: ($) =>
      seq(
        $.keyword_truncate,
        $.keyword_table,
        $.object_reference,
        optional(";"),
      ),

    _expression: ($) =>
      prec(
        1,
        choice(
          $.literal,
          alias($._qualified_field, $.field),
          $.list,
          $.invocation,
          $.binary_expression,
        ),
      ),
    object_reference: ($) =>
      field(
        "name",
        choice($.identifier, alias($._mybatis_parameter, $.identifier)),
      ),
    field: ($) => field("name", $.identifier),
    _qualified_field: ($) =>
      seq(optional(seq($.object_reference, ".")), field("name", $.identifier)),
    list: ($) => parenList($._expression),
    literal: ($) =>
      prec(
        2,
        choice(
          $._integer,
          $._decimal_number,
          $._literal_string,
          $._mybatis_parameter,
          $.keyword_null,
          $.keyword_current_timestamp,
        ),
      ),
    _mybatis_parameter: ($) =>
      prec(
        2,
        choice(
          seq(
            choice("$", "#"),
            "{",
            optional(
              choice(
                $._mybatis_qualified_parameter_name,
                $._mybatis_parameter_name,
              ),
            ),
            "}",
          ),
          seq(
            "#",
            choice(
              $._mybatis_qualified_parameter_name,
              $._mybatis_parameter_name,
            ),
            "#",
          ),
        ),
      ),
    _mybatis_qualified_parameter_name: ($) =>
      seq(
        alias($._mybatis_parameter_name, $.field),
        ".",
        alias($._mybatis_parameter_name, $.field),
        repeat(seq(".", alias($._mybatis_parameter_name, $.field))),
      ),
    _mybatis_parameter_name: (_) =>
      token(new RustRegex("[^.#{}\\r\\n]+")),
    binary_expression: ($) =>
      prec.left(
        2,
        seq(
          field("left", $._expression),
          choice(
            "=",
            token(prec(-1, "<")),
            "<=",
            ">",
            ">=",
            "!=",
            "<>",
            "+",
            "-",
            "*",
            "/",
            "%",
            "||",
            $.keyword_and,
            $.keyword_or,
            seq($.keyword_is, optional($.keyword_not)),
          ),
          field("right", $._expression),
        ),
      ),
    invocation: ($) =>
      seq($.object_reference, seq("(", optional($._expression), ")")),

    CDSect: ($) => seq($.CDStart, optional($.CData), "]]>"),
    CDStart: (_) => seq("<![", "CDATA", "["),
    CData: ($) => $.statement,

    element: ($) =>
      choice($.EmptyElemTag, seq($.STag, optional($.content), $.ETag)),
    EmptyElemTag: ($) => seq("<", $.Name, repeat($.Attribute), "/>"),
    STag: ($) => seq("<", $.Name, repeat($.Attribute), ">"),
    ETag: ($) => seq("</", $.Name, ">"),
    content: ($) =>
      repeat1(
        choice($.CharData, $.element, $._reference, $.CDSect, $.PI, $.Comment),
      ),
    CharData: (_) =>
      token(prec(-1, repeat1(choice(new RustRegex("[^<&]+"), "&")))),
    _reference: ($) => choice($.EntityRef, $.CharRef),
    EntityRef: ($) => seq("&", $.Name, ";"),
    CharRef: ($) =>
      choice(
        seq("&#", new RustRegex("\\d+"), ";"),
        seq("&#x", new RustRegex("[0-9A-Fa-f]+"), ";"),
      ),

    Comment: (_) =>
      token(
        seq(
          "<!--",
          repeat(
            choice(new RustRegex("[^-]"), seq("-", new RustRegex("[^-]"))),
          ),
          "-->",
        ),
      ),
    comment: (_) =>
      choice(
        new RustRegex("--[^\\r\\n]*"),
        token(
          seq(
            "/*",
            repeat(
              choice(new RustRegex("[^*]"), seq("*", new RustRegex("[^/]"))),
            ),
            "*/",
          ),
        ),
      ),
    Attribute: ($) => seq($.Name, "=", $.AttValue),
    Name: (_) => token(XML_NAME),
    AttValue: ($) =>
      choice(
        seq(
          '"',
          repeat(choice($.EntityRef, $.CharRef, new RustRegex('[^"&]'))),
          '"',
        ),
        seq(
          "'",
          repeat(choice($.EntityRef, $.CharRef, new RustRegex("[^'&]"))),
          "'",
        ),
      ),

    _integer: (_) =>
      token(
        new RustRegex("(0[xX][0-9A-Fa-f]+|0[bB][01]+|\\d+([eE][+-]?\\d+)?)"),
      ),
    _decimal_number: (_) =>
      token(new RustRegex("(\\d+[.]\\d*|[.]\\d+)([eE][+-]?\\d+)?")),
    _literal_string: (_) =>
      token(
        choice(
          new RustRegex("'([^']|'')*'"),
          new RustRegex('"([^"]|"")*"'),
          new RustRegex("&quot;[^<&]*&quot;"),
          new RustRegex("&apos;[^<&]*&apos;"),
        ),
      ),
    _identifier: (_) =>
      token(
        new RustRegex(
          "[A-Za-z_\\u{00C0}-\\u{017F}][0-9A-Za-z_\\u{00C0}-\\u{017F}]*",
        ),
      ),
    identifier: ($) => $._identifier,

    ...Object.fromEntries(
      SQL_KEYWORDS.map((keyword) => [
        `keyword_${keyword}`,
        () =>
          token(
            prec(
              1,
              new RustRegex(
                keyword
                  .split("")
                  .map((char) => `[${char.toLowerCase()}${char.toUpperCase()}]`)
                  .join(""),
              ),
            ),
          ),
      ]),
    ),
  },
});
