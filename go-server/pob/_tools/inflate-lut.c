/* Build-time helper: inflate a raw zlib stream from stdin to stdout.
 *
 * The Docker builds use this to pre-extract Path of Building's Timeless
 * Jewel lookup tables (Data/TimelessJewelData/*.zip are raw zlib streams,
 * GloriousVanity is split across .zip.part*) into the .bin files PoB
 * prefers. Doing it at build time means the LuaJIT runtime never has to
 * inflate them itself — Debian's LuaJIT 2.1.0-beta3 segfaults inside
 * lua-zlib on multi-megabyte streams.
 */
#include <stdio.h>
#include <zlib.h>

int main(void) {
    static unsigned char in[1 << 16], out[1 << 16];
    z_stream s = {0};
    int ret = Z_OK;

    if (inflateInit(&s) != Z_OK)
        return 1;
    while (ret != Z_STREAM_END) {
        s.avail_in = (uInt)fread(in, 1, sizeof in, stdin);
        if (s.avail_in == 0)
            break;
        s.next_in = in;
        do {
            s.avail_out = sizeof out;
            s.next_out = out;
            ret = inflate(&s, Z_NO_FLUSH);
            if (ret != Z_OK && ret != Z_STREAM_END) {
                inflateEnd(&s);
                return 1;
            }
            fwrite(out, 1, sizeof out - s.avail_out, stdout);
        } while (s.avail_out == 0);
    }
    inflateEnd(&s);
    return ret == Z_STREAM_END ? 0 : 1;
}
