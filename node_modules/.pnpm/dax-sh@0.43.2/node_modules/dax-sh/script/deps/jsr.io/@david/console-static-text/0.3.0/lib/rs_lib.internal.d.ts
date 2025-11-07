export function __wbg_set_wasm(val: any): void;
/**
 * @param {any} items
 * @param {number | null} [cols]
 * @param {number | null} [rows]
 * @returns {string | undefined}
 */
export function static_text_render_once(items: any, cols?: number | null | undefined, rows?: number | null | undefined): string | undefined;
/**
 * @param {string} text
 * @returns {string}
 */
export function strip_ansi_codes(text: string): string;
export function __wbg_buffer_609cc3eee51ed158(arg0: any): any;
export function __wbg_call_672a4d21634d4a24(...args: any[]): any;
export function __wbg_done_769e5ede4b31c67b(arg0: any): any;
export function __wbg_entries_3265d4158b33e5dc(arg0: any): [string, any][];
export function __wbg_get_67b2ba62fc30de12(...args: any[]): any;
export function __wbg_get_b9b93047fe3cf45b(arg0: any, arg1: any): any;
export function __wbg_instanceof_ArrayBuffer_e14585432e3737fc(arg0: any): boolean;
export function __wbg_instanceof_Map_f3469ce2244d2430(arg0: any): boolean;
export function __wbg_instanceof_Uint8Array_17156bcf118086a9(arg0: any): boolean;
export function __wbg_isArray_a1eab7e0d067391b(arg0: any): arg0 is any[];
export function __wbg_isSafeInteger_343e2beeeece1bb0(arg0: any): boolean;
export function __wbg_iterator_9a24c88df860dc65(): symbol;
export function __wbg_length_a446193dc22c12f8(arg0: any): any;
export function __wbg_length_e2d2a49132c1b256(arg0: any): any;
export function __wbg_new_a12002a7f91c75be(arg0: any): Uint8Array;
export function __wbg_next_25feadfc0913fea9(arg0: any): any;
export function __wbg_next_6574e1a8a62d1055(...args: any[]): any;
export function __wbg_set_65595bdd868b3009(arg0: any, arg1: any, arg2: any): void;
export function __wbg_value_cd1ffa7b1ab794f1(arg0: any): any;
export function __wbindgen_bigint_from_i64(arg0: any): any;
export function __wbindgen_bigint_from_u64(arg0: any): bigint;
export function __wbindgen_bigint_get_as_i64(arg0: any, arg1: any): void;
export function __wbindgen_boolean_get(arg0: any): 0 | 1 | 2;
export function __wbindgen_debug_string(arg0: any, arg1: any): void;
export function __wbindgen_error_new(arg0: any, arg1: any): Error;
export function __wbindgen_in(arg0: any, arg1: any): boolean;
export function __wbindgen_init_externref_table(): void;
export function __wbindgen_is_bigint(arg0: any): arg0 is bigint;
export function __wbindgen_is_function(arg0: any): boolean;
export function __wbindgen_is_object(arg0: any): boolean;
export function __wbindgen_jsval_eq(arg0: any, arg1: any): boolean;
export function __wbindgen_jsval_loose_eq(arg0: any, arg1: any): boolean;
export function __wbindgen_memory(): any;
export function __wbindgen_number_get(arg0: any, arg1: any): void;
export function __wbindgen_string_get(arg0: any, arg1: any): void;
export function __wbindgen_throw(arg0: any, arg1: any): void;
export class StaticTextContainer {
    __destroy_into_raw(): number;
    __wbg_ptr: number;
    free(): void;
    /**
     * @param {any} items
     * @param {number | null} [cols]
     * @param {number | null} [rows]
     * @returns {string | undefined}
     */
    render_text(items: any, cols?: number | null | undefined, rows?: number | null | undefined): string | undefined;
    /**
     * @param {number | null} [cols]
     * @param {number | null} [rows]
     * @returns {string | undefined}
     */
    clear_text(cols?: number | null | undefined, rows?: number | null | undefined): string | undefined;
}
//# sourceMappingURL=rs_lib.internal.d.ts.map