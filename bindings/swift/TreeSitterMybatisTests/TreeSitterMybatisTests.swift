import XCTest
import SwiftTreeSitter
import TreeSitterMybatis

final class TreeSitterMybatisTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_mybatis())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Mybatis grammar")
    }
}
