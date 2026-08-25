package matching

import (
	"context"

	"github.com/doctormarriagebureau/api/internal/cards"
	"github.com/doctormarriagebureau/api/internal/models"
	"github.com/doctormarriagebureau/api/platform/postgres"
)

func fetchCardsByIDs(ctx context.Context, pg *postgres.Client, ids []int64) (map[int64]*models.DoctorCard, error) {
	return cards.FetchByIDs(ctx, pg, ids)
}

func fetchCardByID(ctx context.Context, pg *postgres.Client, id int64) (*models.DoctorCard, error) {
	return cards.FetchOne(ctx, pg, id)
}
