import { PoBDecoder } from '../utils/PoBDecoder';
import { describe, it, expect } from 'vitest';

// TODO: move strings to separate file
describe('simpleParse', () => {
    it('we get one item, abberaths bootsies', async () => {
        // One item PoB string 3.21
        const pobString = 'eNqtW21z4jgS_jz8ChVVe7VbtwnvJJMju0UCealNZrKQzNx9mhK2AG2ExdhyEvbq_vt1SzYYBjk2dlIVjNX9qLvVanW3nd7vbwtBXpgfcOmdVxvH9SphniNd7s3Oq0-PV0en1d9_q_QeqJp_nl6EXODIb5UPPX1NBHthAviqRFF_xtSXGKn1DZCW1FNzJr17-pf0r6V7Xv0kPVYlE-q5XMXfHEGD4BNdsPPq2AHmKqGBwzz3cnM_IpxTnzqK-Xc4az9U8l66MKr8EEYXlHtj6Twzde3LcKmFeuHs1dDc3j98Hj0mROJeUiTQ6EPvQdAV88eKKhLAn_NqHwxDZ-yGK4CiIgScbue4W62lkl-EfqAGdAGXmdjGS8bcNWXDRvbgs-F0yhzFX9ilz9XlnHrOZoaOjS8v7X0oFF8KzvyNTMdWjpsfwBv1uo34USoqBg_jTGYxxHJjeivsV67mFwKMmBX6duZxxZLUp-3jk5PTVrtZ77bqzW7aTD8yNzr149aau5XG_CB5IL28JjhA0stQCNipSU6r_UYsYP4LVXxbMiv9pVxMuLdt7ow2uKcevZRBhkVFygfmQyBQuRjGzJEQO_LOkZPzjk9ZdspcekQMeaU5TI_hOCtdbuDDBBpB1MxGOZahyEipNqGsbY1kA_a2pmqm7JXvW4T2GOOpDHAD9iKVPvPeU0LHguHNwyYQtI67rY_tk9OPHzsndrUe5quAO1Tc0ze-CBcQrx_pM9tMeNK0e9VsrjwIIjZW-6RX3Gf5uS6lcA_gmlMZ5GfDPZPBCHA4O2dIe-s52Tbik-freJo409NsPGUj2B6YOUwEy8ixmSLaZFkOXzPVjHnRfKts6twx5syvIbcaUcWyhdRNnlFPNSvSZjIrEu4xaycjQw4jIaPFSMcf05hymmnoMX-2Gs85E24-6liwS7rMEPnQzEnuTObeni6XxyRZc5rkK_XdbOdDXpleaJAMse9s9og8m2MySDuBwWU7SXCrbk_j5V-YxIucfH1_IUM_45Ib4kwqxOeDKVhGzA2dbAfShYBia0f8NKmEyMXRV4o6zwPpzliuSfJzjMPlEkIFLnpWPjzfIGvmiezjqJuB-jN4bKaNi0dh9gk21JknWB_u2WfZYcmuCx7QOZTZkGeeYl0Y30NMWECs1zU1VP6JErZhz1agVspU-GjC7XLMvq_kKwg_x65IkI8acplNPLCK4jPv71Vm_C3yTBMMPTf0cTdknmOXY980j3wBITMIBlRR4kbJ7xfqc-qppm7ZBIz6zvwOVv-KCjGBGHBeTd7FbzuMjbhr0qvprhRe3S6W0leEveHHA_XV6rw6pSJghlDfAZxAcU8XvhBwhKiS8Vy-9t0X1OJRShHETIQul8xztzAefcYI1W6HQReF0Dril2QL69ZFo5EFDRScV8ZVA1TDkyAApDGnp61WlSiAS7TPmo2oM2bYEflD72l0py8-zJVaBme12uvr6_GSqrmcsjc4Uo4duagtgQlkOgqeuRBHCFvrw8_FrK9_NFAtRuqZlllglqeGsmtDonJ48UkqFuAY3oy_9MYIHZAAbHvNFsHFCrbEFZ75O82ByDpIPWbKrG-SJ-7duWxKQ4H3_wyp4LhY9eTdO9Nm9KS_WFcyAAWLhcHbID6ulmjN_t2dGekLFYHhdPHKmRWKBCLcjVctuqm7iP2N1JdUOIGWm3uOCF0oA6JoAdJwcBhBJygZ6hVClgl1n2KLs8ZZfzKBlF7N_0GXMvhXQG4kRKbgV3It4SZ3GbmQUgXYbMW8340NEQiJR6sZ25FlLeqHHmgUcV4LOaGiGUtj7HRS3RptrNERBv1pxJYM3N6bgb87z6_0BQa_Jyy_I5UjQ09FU3h0Ebn7ropXIWRjNWPMmpY48qnI2tqvjOfgpTatprj1lqHSwOfVBQ-cb5NwOsW2LUisfN2JHl5dDS8fb78MoziSZNFaffPCxQRbluZz00cdM53PkCCcBObyvPqFs1ctyIApykWAGgpBlwFb73DtGpHkAvhS0DQVVJ5xy3c_1obAjjR8Yz6uCqTCjs-ZVa71-DtCmQkxTca4a0PDHqsdyORhlxC8TBpvsZTuYdtRsLFsVQcHU3ghlFNhnTkafccSCoMDeC2fcgePrPQlx1BiqFLs4jhw2jmrlPWOskk7hm5a2wDMoJ3ZtJJt3NFoilV1G9tqVTNqZx8wh1p1N4N25nVlKD39bGU_ypoqBemT9LSTw6bpc4GZn3Vlh4KtSeyAn9Wc-dEZbUO6hxgVk6RuHJ9PQmXfxgmKFFvpPpXFQjhmZzW9GIsOOJYSibb6ExaDJmnsUKautwayNFZTBVjtF9UUKUsQ1cwW85vRFCPEjQOL_tFwyibR8bf_Irlr6krLdtkhSwsYcFwXh9E1cnGY3eq5OOIVJLzP1vWORu3sT4pjCrMHxeQxmUBwUxVDwL1VDGG0m0hseEfpKYSOXwM2ZWDo1AC2pklZXxV6AzjkVMraZoTSYu3fCBvVcmGZUL5X09yIxkGjJwdpPmxI3gGCs-gmJdvJhrTuaNwwKvC5sRTFAH94QlJIT6hPqOcOsBFbUFHs44ZLAIsl-7wvXd0s6S5qrxYXErogx9Q-6haMlY-F2d9SLv6jqxq8iirJVlQ9QpI34GBqX7tIPA8S_jvudPSwoguiUhav40o2DJh5svmVQQXk6dtYIpkCBQiT5eWIQpK7OiNPn27_fBpW9peHle3qsBKdMGek046vL2gQP-qFev-M1I-bnUpU556RZr0S1fNn5PpI_1a0xiP2_Yw0mhXIlgV3OI7XK48-n82YHxBNQk7IvoqOvM6ZR4bfQ75cMrfyX596M3ZWP-78758_N-tHrfovREkCtmbeTM0rjc5PWCr7DOR0SdyOI7o-SDL_3D1q1H_5Cd_pAcsjhEk5K19xupUMyR9YjlMvuu8SSDcWq18BfAoaKBxhINQLJP-Ab4gI-Bajzpx44ACTlWGpNJISYS-WGB8iS-aDxTayX4Q-tjdxMaZLqDthBbCWhUp0hHITLT0-CepUo6WNql0rRfNdita7FO13KeJn0DV0urX3YX_D5qLbjQ8hFQHrLR4mT6M73ZjSdfW1QJ-s6iHThKqlM5hJSCMHi_Zz8LtVEFBBjO-STh4AJtQufzMHvz6KSesALcn4lS53p24fAlRA_QijWQLGfoW6JSjULUGhgzD2KVTYO1slWKRZljZ5_O2GQcqkCtljz2brFpagmRuh8JStsuzfKcEZGiVsj0YJcrRzekJZIaZZdEe2SzBg_jOjtBDbKqp_s-AWzieAuyKmc1LEB01uUQRh_8buFEbolrWsjbJiTH7XLG7HduG17JTjVHmU7y9CwVQJkbBVQkBpFdyU7YL8jXLsf_BJmdtp27k5DsmiClq1UzRWl7Qs7bKCS2l59cElVA6-EVbnzcKhqVnOGpR2UpRR8LUP0ymv8Yuf8SUlG53CghQ_4rp5g8GGvnFQ8PhxQtPziV-u0J1K_W6F9KZ8Fr-m5bC5FC7zI2iGXbHon87ityVOkq9E76PHZ_TxCw4xU-sdntjFYvpm8_054jcwY55OOkv01qoUQrfGkgqlM66f7cUM3ZN0hu33ZBMTxV3oyOS92u7_Sv4fHG1GiQ==';
        const decoder = new PoBDecoder();
        await decoder.decode(pobString).then(async function name(xmlDoc) {
            const items = await decoder.extractItems(xmlDoc);
            console.log(items);
            expect(items).toEqual([
                {
                    itemClass: 'Boots',
                    name: "Abberath's Hooves",
                    rarity: 'Unique',
                    wikiUrl: "https://www.poewiki.net/images/a/a2/Abberath%27s_Hooves_inventory_icon.png"
                }
            ]);

        });
    });

    it('we get two items, abberaths bootsies and rare bow', async () => {
        // Two items PoB string 3.21
        const pobString = 'eNq9W21v2zgS_lz_CsLAHnbRTWzLL2l9yS6cxHnBJm3WTtq7TwUt0TY3tOhKVBLv4f77zZCSLbumIkXCpUAjifMMZ4bD4cxIOf79ZSHIEwtCLv2TeuuwWSfMd6XH_dlJ_eH-4uBD_fffasd3VM0_T08jLnDkt9q7Y31NBHtiAnB1omgwY-pLwqn9DTgtqa_mTPq39C8ZXErvpP5J-qxOJtT3uEruXEHD8BNdsJP62AVwndDQZb53tnkeE85pQF3FghucdRApeSs9GFVBBKMLyv2xdB-ZugxktNRCPXH2bGiub-8-j-5TInE_LRJo9O74TtAVC8aKKhLCfyf1ARiGztgVV8CKigj49LqHvXojk_w0CkJ1ThdwmQs2XjLmrSlbNrK7gA2nU-Yq_sTOAq7O5tR3NzN0bbiitLeRUHwpOAs2Mh1aEVc_MG81mzbie6moOL8b5zKLIZYb01vZfuVqfirAiHlZX898rlia-kPn8OjoQ7vjNHvtptPLmulHcKvbPGyv0e0s8J3kofSLmuANkp5FQsBOTSOt9huxkAVPVPFtyaz0Z3Ix4f62uXPa4Jb69EyGORYVKe9YAIFAFQKMmSshdhSdoyDyhk9ZfspCesSAotK8TY_hOC9dYcZvE2gEUTMf5VhGIiel2oSyjjWSnbOXNZWTsVe-pwlbRx-tQcZXOfidsyep9KH3mhY6GAyv7jaRoH3Ya3_sHH34-LF7ZNfrbr4KuUvFLX3hi2gBAfuePrLNhEeO3a1mc-VDFLFB7ZNe8IAVR51J4b0BNacyLA7DTZPDCHA6u32kvfbdfDvxwQ90QE0d6lk2nrIR7A9MHSaC5URspoh3WZ7T10w1Y3483yqfOjeMufNLSK5GVLF8MXWTaDQzzYq0ucyKhHvM2s0JKGAkBFqMdPgxC1TQTEOfBbPVeM6Z8IpRJ4Kd0WWO0IdmTqNzmXt7ukIek4YWNMlXGnj5DoiiMj3RMB1iX9nsMXk-x2SQdwLAYztZcLtpz-PlX5jFi4K4QbCQUZBzyQ1xLhWS88FULCPmRW6-A-lUQLW1I36WVEIUQgyUou7jufRmrNAkxRHjaLmEUIGLnheH5xukzTyVfhz0clB_Bo_NtXHxKMw_wYY69wTrwz3_LDuQ_LrgAV1AmQ157inWlfEtxIQFxHpdVEPpn6phW_ZsBYqlXJWPJtyux-z7Sj6D8HNsi4TFqCGX2cQDqygB8_9e5ea_RZ5rgqHvRQHuhtxz7CL2TXPPFxAyw_CcKkq8OPn9QgNOfeXonk3IaODOb2D1L6gQE4gBJ_X0U7zbAbaStslxQ7el8Op6sZSBIuwFf93RQK1O6lMqQmYI9RPgEyru68oXAo4QdTKey-eB94Ra3EspwgRE6HLJfG-Lx33AGKHa7TDoohBaR7xJ97CuPTQaWdBQwXllXDVENXwJAkAa8-FDu10nCtil-mdOK26NGThyfnf8MLrRF-_mSi3DfqPx_Px8uKRqLqfsBY6UQ1cuGksAgUwH4SMX4gDZNgbwczob6B_NqJFwOjY9s9AsTwNl14ZE5fDik1QsxDF8mNwcj5F1SEKw7SVbhKcr2BIXeObvdAdi6yD1mCmzvmlM0rzz2JRGAp__GVHBcbGa6ac3ps_oy2CxrmSAFSwWBm_D8X61RGsObm7MyEComBlOl6ycWaFYIMK9ZNXih7qNONhIfUaFG2q5ue-KyIMyII4WIA0HhxF0gpKhXhFkmVD3Kbbot_qDyQRSejX_B13K8J8huZIQmcJfyaWEh9xj5FRKFWK3FfN-LzFEKCQerWZsR5a1qO-OQaMYeSnkhAonkcbY6ai-Ndpac0c26E8jtmTg9v4M_N19fKZPMPg9ZfkdqVwZ-SqewqeL2N13VbyIIBtrGGM2tMSxT8XW1n5lPAcvtWk1xbW_jJRmfFJf8ND9NommU-zbgsQq0K3o4cXF8Oz--sswjiNpiNbqmx8tJtizNL83jdQx0_kMCaNJaC5P6l84e9aCnDNFuQhRQyHoMmTrHa5dI5ZcAC6Dm6aCyjPp-e7ntSGwcxq-sABXBVJhN-DMKtd6_BWhzISYJmPctXHDJqudkcnDziB4mTTeYindxLZzwc6yVR0czMBCKKfCOnM8-oolFAYH8Fo-5S4eWdlLjqHEUGXYxXXhtHNXGesdZ5N2HrprbWNgBu1g00u2oePRDKvqPrbVqmbUDj9nLrXqbgbt4HVlKH39cmU_lzVVBqdP0tdODptmwAVmftaVHQq2JrEz_KzmLIjPaBunW4hRCUnmxgn4JFL2bZyiyLCV7lNZLIRjdqjpxVh0wLGMSLTVn7AYNE1jZ2Xqemsgy4KaKsBqv7imyFiCuGa2mN-MZhghaRxY9I-HMzaJjr-DJ8k9U1datssOWVbAgOO6PBtdI5dns1s9l-d4AQnvo3W941E7_EFxTGH2cDF5TC4muKnKccC9VY7DaDeR2GBH2SmEjl_nbMrA0JkBbE2Tsb4q8s_hkFMZa5uTlRZr_0bYqFaIlwnlezUtzNE4aPzmIMuHDckrjOAsusrIdvJxWnc0rhgV-OJYinIMf3hDUkpPqE-o751jI7akotjHjZbALJHs8750dbOku1yPG0khoQtyTO3jbsFYBViY_S3l4t-6qsGruJJsx9UjJHnnHEwdaBdJ5kHCfyWdjmOs6MK4lMXrpJKNQmZebX5lUAH5-jGWSKZAAcJ0eTmikOSu-uTh0_WfD8Pa_vKwtl0d1uITpk-6neT6lIbJu16o9_ukeeh0a3Gd2ydOsxbX831yeaD_1bTGI_a9T1pODbJlwV2O483afcBnMxaERJOQI7KvoiPPc-aT4feIL5fMq_0noP6M9ZuH3f--_9lpHrSbvxAlCdia-TM1r7W6P2GpHDCQ0yNJO47o-iAN_rl30Gr-8hN-1AOWRxYm5ax9xelWMiJ_YDlO_fi5RyDdWKx-BeZT0EDhCAOhniD5B_6GiIBvMerOiQ8OMFkZSK2Vlgh7scT4EFmyACy2kf00CrC9iYsxXULdCSuAtSxUoiOUm2jp8U1Qtx4vbVztWimcVynar1J0XqVIvgJpoNNte5-z7X2jwWhYe98G93qu3c85eoq-PgvoFGzcJ-j_tbuATflLn6SW60a6VFzHVjQuxrykMdPKjYC5EpCzBuEXWLUxlPxZHDxTh2o_ctbUW1B9k7UVdrZDt7e9Hd630A3NXpBTkshMsH1Ue-_sHwSNDMHHtJcZYWOv_3_50M76Y3_LFqK2G19CKgK7Z3E3eRjd6Mak7qtcCoxJdT1kmpCNbICZhLQ2EOc1iI5zEHdWYUhFbFXSLTDnKRNqF-8UwOtUjLTfoCUZP9Pl7tSdtzAqoX7Mw6mAx36FehUo1KtAoTfx2KdQq4hz7fPOdgUWcarSpoi_XTFImVUpe-zZbL3SEjiFOZSesl2V_bsVOEOrgu3RqkCOTkFPqCrEOGV3ZKcCAxY_MyoLse2y-jslt3AxAbwVMZ2zMj5ocosyHPZv7G5pDr2qlrVVVYwp7prl7dgpvZbdapyqiPKDRSSYqiAStisIKO2Sm7JTEt-qxv5vPikLO22nMOItWVRJq3bLxuqKlqVTVXCpLK9-cwlVADfC7oxTOjQ51axBZSdFFQVf5206FTV--TO-omSjW1qQ8kdcr2gw2NC33hQ8fpzQ9HySj2t0p1p_WyP9KZ8ln-m5bC6Fx4KYNcOuaPxXh8nXMkfpT-L30eM3GskHLgmo_QomcbGE3nFenyP5AjfBdLMh8VfLUgjdGksrlA1cv9tNAL2jbMD2d9KpiZK3ELHJjxu7fyz7P8ks59E='
        const decoder = new PoBDecoder();
        await decoder.decode(pobString).then(async function name(xmlDoc) {
            const items = await decoder.extractItems(xmlDoc);
            console.log(items);
            expect(items).toEqual([
                {
                    itemClass: "Boots",
                    name: "Abberath's Hooves",
                    rarity: "Unique",
                    wikiUrl: "https://www.poewiki.net/images/a/a2/Abberath%27s_Hooves_inventory_icon.png"
                },
                {
                    itemClass: "Bow",
                    name: "Thicket Bow",
                    rarity: "Normal", // TODO: rarity is broken, its taken from wiki base!
                    wikiUrl: "https://www.poewiki.net/images/8/8c/Thicket_Bow_inventory_icon.png",
                },
            ]);
        });
    });
});
