(XMLDecl) @keyword.directive

(doctypedecl
  (Name) @type.definition
  (ExternalID
    (PubidLiteral) @string.special
    (SystemLiteral
      (URI) @string.special.url)))

(Comment) @comment

(STag
  (Name) @tag)

(ETag
  (Name) @tag)

(EmptyElemTag
  (Name) @tag)

(Attribute
  (Name) @tag.attribute
  (AttValue) @string)

(EntityRef) @constant
(CharRef) @constant

(CDSect
  (CDStart) @markup.heading
  (CData) @markup.raw
  "]]>" @markup.heading)

(object_reference
  name: (identifier) @type)

(invocation
  (object_reference
    name: (identifier) @function.call))

(relation
  alias: (identifier) @variable)

(field
  name: (identifier) @field)

(term
  alias: (identifier) @variable)

(literal) @string

((literal) @number
  (#match? @number "^[-+]?\\d+$"))

((literal) @float
  (#match? @float "^[-+]?\\d*\\.\\d*$"))

((literal) @variable.parameter
  (#match? @variable.parameter "^[$#]"))

(comment) @comment @spell

[
  (keyword_and)
  (keyword_as)
  (keyword_call)
  (keyword_current_timestamp)
  (keyword_delete)
  (keyword_distinct)
  (keyword_from)
  (keyword_full)
  (keyword_inner)
  (keyword_insert)
  (keyword_into)
  (keyword_is)
  (keyword_join)
  (keyword_left)
  (keyword_not)
  (keyword_null)
  (keyword_on)
  (keyword_or)
  (keyword_right)
  (keyword_select)
  (keyword_set)
  (keyword_table)
  (keyword_truncate)
  (keyword_update)
  (keyword_values)
  (keyword_where)
] @keyword
