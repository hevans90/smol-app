package smoldata

import (
	"context"
	"database/sql"

	"pob"
)

// InsertCharacterStats upserts one character's PoB-computed stats keyed by
// the ladder character id (one row per character, newest sweep wins).
func InsertCharacterStats(ctx context.Context, q *Queries, characterID string, stats *pob.Stats) error {
	params := UpsertCharacterStatsParams{
		CharacterID:            characterID,
		MainSkill:              sql.NullString{String: stats.MainSkill, Valid: stats.MainSkill != ""},
		CombinedDps:            stats.CombinedDPS,
		TotalDps:               stats.TotalDPS,
		FullDps:                stats.FullDPS,
		TotalDotDps:            stats.TotalDotDPS,
		Life:                   stats.Life,
		LifeUnreserved:         stats.LifeUnreserved,
		EnergyShield:           stats.EnergyShield,
		Mana:                   stats.Mana,
		Ward:                   stats.Ward,
		TotalEhp:               stats.TotalEHP,
		Armour:                 stats.Armour,
		Evasion:                stats.Evasion,
		BlockChance:            stats.BlockChance,
		SpellBlockChance:       stats.SpellBlockChance,
		SpellSuppressionChance: stats.SpellSuppressionChance,
		FireResist:             stats.FireResist,
		ColdResist:             stats.ColdResist,
		LightningResist:        stats.LightningResist,
		ChaosResist:            stats.ChaosResist,
		CritChance:             stats.CritChance,
		CritMultiplier:         stats.CritMultiplier,
		AttackSpeed:            stats.AttackSpeed,
	}

	return q.UpsertCharacterStats(ctx, params)
}
