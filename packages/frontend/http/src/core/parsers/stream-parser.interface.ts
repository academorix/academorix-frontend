/**
 * Streaming parser contract.
 *
 * Stateful parser fed `Uint8Array` chunks from the connector. Returns
 * decoded values per chunk — implementations buffer partial frames
 * internally and emit complete values only.
 *
 * Canonical definition lives in `../interfaces/stream-parser.interface`;
 * re-exported here so the parser implementations can import it from a
 * co-located path.
 *
 * @module @stackra/http/parsers/stream-parser
 */

export type { IStreamParser } from "../interfaces/stream-parser.interface";
