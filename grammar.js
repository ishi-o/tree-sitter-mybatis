/**
 * @file Tree-sitter grammar for MyBatis and iBATIS mapper files.
 * @author ishi-o <458457289@qq.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const XML_NAME = /[A-Za-z_][A-Za-z0-9_.:-]*/;
const WS = /[ \t\r\n]+/;

/** @param {any} $ @param {string} name */
function openTag($, name) {
  return seq("<", name, repeat(seq(WS, $.Attribute)), optional(WS), ">");
}

/** @param {any} $ @param {string} name */
function selfClosingTag($, name) {
  return seq("<", name, repeat(seq(WS, $.Attribute)), optional(WS), "/>");
}

/** @param {any} $ @param {string} name */
function closeTag($, name) {
  return seq("</", name, optional(WS), ">");
}

/** @param {any} $ @param {string} name @param {any} body */
function taggedElement($, name, body) {
  return choice(
    seq(openTag($, name), repeat(body), closeTag($, name)),
    selfClosingTag($, name),
  );
}

module.exports = grammar({
  name: "mybatis",

  // Whitespace is part of SQL text, so it must not be globally skipped.
  extras: ($) => [],
  word: ($) => $.identifier,

  rules: {
    document: ($) =>
      repeat(
        choice(
          $.XMLDecl,
          $.doctype,
          $.Comment,
          $.Mapper,
          $.sql_map,
          $.processing_instruction,
          $.generic_element,
          $.text,
          WS,
        ),
      ),

    Mapper: ($) =>
      prec(12, seq($.MapperSTag, repeat($.mapper_item), $.MapperETag)),

    MapperSTag: ($) => openTag($, "mapper"),
    MapperETag: ($) => closeTag($, "mapper"),

    sql_map: ($) =>
      prec(12, seq($.SqlMapSTag, repeat($.mapper_item), $.SqlMapETag)),

    SqlMapSTag: ($) => openTag($, "sqlMap"),
    SqlMapETag: ($) => closeTag($, "sqlMap"),

    mapper_item: ($) =>
      choice(
        $.select_statement,
        $.insert_statement,
        $.update_statement,
        $.delete_statement,
        $.procedure_statement,
        $.statement_statement,
        $.select_key,
        $.sql_fragment,
        $.include_element,
        $.dynamic_element,
        $.Comment,
        $.cdata,
        $.generic_element,
        WS,
      ),

    select_statement: ($) =>
      prec(10, taggedElement($, "select", $.statement_content)),
    insert_statement: ($) =>
      prec(10, taggedElement($, "insert", $.statement_content)),
    update_statement: ($) =>
      prec(10, taggedElement($, "update", $.statement_content)),
    delete_statement: ($) =>
      prec(10, taggedElement($, "delete", $.statement_content)),
    procedure_statement: ($) =>
      prec(10, taggedElement($, "procedure", $.statement_content)),
    statement_statement: ($) =>
      prec(10, taggedElement($, "statement", $.statement_content)),
    select_key: ($) =>
      prec(10, taggedElement($, "selectKey", $.statement_content)),
    sql_fragment: ($) => prec(10, taggedElement($, "sql", $.element_content)),

    include_element: ($) =>
      prec(10, taggedElement($, "include", $.element_content)),

    statement_content: ($) =>
      choice(
        $.select_key,
        $.include_element,
        $.dynamic_element,
        $.Comment,
        $.cdata,
        $.generic_element,
        $.text,
      ),

    element_content: ($) =>
      choice(
        $.include_element,
        $.dynamic_element,
        $.Comment,
        $.cdata,
        $.generic_element,
        $.text,
      ),

    choose_item: ($) =>
      choice(
        $.when_element,
        $.otherwise_element,
        $.include_element,
        $.Comment,
        $.cdata,
        $.generic_element,
        $.text,
      ),

    dynamic_element: ($) =>
      choice(
        $.if_element,
        $.choose_element,
        $.when_element,
        $.otherwise_element,
        $.trim_element,
        $.where_element,
        $.set_element,
        $.foreach_element,
        $.bind_element,
        $.dynamic_sql_element,
        $.iterate_element,
        $.is_not_empty_element,
        $.is_empty_element,
        $.is_equal_element,
        $.is_not_equal_element,
        $.is_greater_than_element,
        $.is_greater_equal_element,
        $.is_less_than_element,
        $.is_less_equal_element,
        $.is_not_null_element,
        $.is_null_element,
        $.is_property_available_element,
        $.is_not_property_available_element,
        $.is_parameter_present_element,
        $.is_not_parameter_present_element,
      ),

    if_element: ($) => prec(9, taggedElement($, "if", $.element_content)),
    choose_element: ($) => prec(9, taggedElement($, "choose", $.choose_item)),
    when_element: ($) => prec(9, taggedElement($, "when", $.element_content)),
    otherwise_element: ($) =>
      prec(9, taggedElement($, "otherwise", $.element_content)),
    trim_element: ($) => prec(9, taggedElement($, "trim", $.element_content)),
    where_element: ($) => prec(9, taggedElement($, "where", $.element_content)),
    set_element: ($) => prec(9, taggedElement($, "set", $.element_content)),
    foreach_element: ($) =>
      prec(9, taggedElement($, "foreach", $.element_content)),
    bind_element: ($) => prec(9, taggedElement($, "bind", $.element_content)),

    // iBATIS 2 dynamic SQL tags.
    dynamic_sql_element: ($) =>
      prec(9, taggedElement($, "dynamic", $.element_content)),
    iterate_element: ($) =>
      prec(9, taggedElement($, "iterate", $.element_content)),
    is_not_empty_element: ($) =>
      prec(9, taggedElement($, "isNotEmpty", $.element_content)),
    is_empty_element: ($) =>
      prec(9, taggedElement($, "isEmpty", $.element_content)),
    is_equal_element: ($) =>
      prec(9, taggedElement($, "isEqual", $.element_content)),
    is_not_equal_element: ($) =>
      prec(9, taggedElement($, "isNotEqual", $.element_content)),
    is_greater_than_element: ($) =>
      prec(9, taggedElement($, "isGreaterThan", $.element_content)),
    is_greater_equal_element: ($) =>
      prec(9, taggedElement($, "isGreaterEqual", $.element_content)),
    is_less_than_element: ($) =>
      prec(9, taggedElement($, "isLessThan", $.element_content)),
    is_less_equal_element: ($) =>
      prec(9, taggedElement($, "isLessEqual", $.element_content)),
    is_not_null_element: ($) =>
      prec(9, taggedElement($, "isNotNull", $.element_content)),
    is_null_element: ($) =>
      prec(9, taggedElement($, "isNull", $.element_content)),
    is_property_available_element: ($) =>
      prec(9, taggedElement($, "isPropertyAvailable", $.element_content)),
    is_not_property_available_element: ($) =>
      prec(9, taggedElement($, "isNotPropertyAvailable", $.element_content)),
    is_parameter_present_element: ($) =>
      prec(9, taggedElement($, "isParameterPresent", $.element_content)),
    is_not_parameter_present_element: ($) =>
      prec(9, taggedElement($, "isNotParameterPresent", $.element_content)),

    generic_element: ($) =>
      prec(
        1,
        choice(
          seq($.STag, repeat($.element_content), $.generic_element),
          $.EmptyElemTag,
        ),
      ),

    STag: ($) =>
      seq("<", $.tag_name, repeat(seq(WS, $.Attribute)), optional(WS), ">"),

    ETag: ($) => seq("</", $.tag_name, optional(WS), ">"),

    EmptyElemTag: ($) =>
      seq("<", $.tag_name, repeat(seq(WS, $.Attribute)), optional(WS), "/>"),

    Attribute: ($) => seq($.Name, optional(WS), "=", optional(WS), $.AttValue),

    Name: ($) => $.identifier,
    AttValue: ($) => choice($.string, $.string),

    string: ($) =>
      choice(
        seq('"', repeat(choice($.entity_reference, /[^"&]/)), '"'),
        seq("'", repeat(choice($.entity_reference, /[^'&]/)), "'"),
      ),

    XMLDecl: ($) =>
      token(seq("<?xml", repeat(choice(/[^?]/, seq("?", /[^?]/))), "?>")),

    processing_instruction: ($) =>
      token(seq("<?", repeat(choice(/[^?]/, seq("?", /[^?]/))), "?>")),

    doctype: ($) => token(seq("<!DOCTYPE", repeat(/[^>]/), ">")),

    Comment: ($) =>
      token(seq("<!--", repeat(choice(/[^-]/, seq("-", /[^-]/))), "-->")),

    cdata: ($) =>
      token(seq("<![CDATA[", repeat(choice(/[^]]/, seq("]", /[^]]/))), "]]>")),

    text: ($) =>
      prec.right(
        repeat1(
          choice(
            $.sql_parameter,
            $.ibatis_parameter,
            $.entity_reference,
            /[^<&$#]+/,
            /[$#]/,
            "&",
          ),
        ),
      ),

    sql_parameter: ($) => token(prec(1, /[$#]\{[^}]*\}/)),
    ibatis_parameter: ($) => token(prec(1, /#[^#\r\n]+#/)),
    entity_reference: ($) =>
      token(prec(1, /&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9A-Fa-f]+);/)),
    identifier: ($) => XML_NAME,
    tag_name: ($) => token(prec(-1, XML_NAME)),
  },
});
