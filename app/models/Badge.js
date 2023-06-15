
const { sql } = require("../config/db.config");

const Badge = function (Badge) {
	this.name = Badge.name;
	this.description = Badge.description;
	this.icon = Badge.icon
};

Badge.create = async (req, res) => {
	sql.query(`CREATE TABLE IF NOT EXISTS public.badge (
        id SERIAL NOT NULL,
		name text,
        description text ,
        icon text,
		condition text,
        createdAt timestamp,
        updatedAt timestamp ,
        PRIMARY KEY (id))  ` , async (err, result) => {
		if (err) {
			res.json({
				message: "Try Again",
				status: false,
				err
			});
		} else {
			const { name, description, condition } = req.body;

			const query = `INSERT INTO "badge"
				 (id,name, description,condition,createdAt ,updatedAt )
                            VALUES (DEFAULT, $1, $2, $3,'NOW()','NOW()' ) RETURNING * `;
			const foundResult = await sql.query(query,
				[name, description, condition]);
			if (foundResult.rows.length > 0) {
				if (err) {
					res.json({
						message: "Try Again",
						status: false,
						err
					});
				}
				else {
					res.json({
						message: "Badge Added Successfully!",
						status: true,
						result: foundResult.rows,
					});
				}
			} else {
				res.json({
					message: "Try Again",
					status: false,
					err
				});
			}

		};
	});
}

Badge.viewSpecific = (req, res) => {
	sql.query(`SELECT * FROM "badge" WHERE ( id = $1)`, [req.body.id], (err, result) => {
		if (err) {
			console.log(err);
			res.json({
				message: "Try Again",
				status: false,
				err
			});
		} else {
			res.json({
				message: "Badge Details",
				status: true,
				result: result.rows
			});
		}
	});
}


Badge.search = async (req, res) => {
	sql.query(`SELECT * FROM "badge" WHERE name ILIKE  $1 ORDER BY "createdat" DESC `
		, [`${req.body.name}%`], (err, result) => {
			if (err) {
				console.log(err);
				res.json({
					message: "Try Again",
					status: false,
					err
				});
			} else {
				res.json({
					message: "Search's Badge data",
					status: true,
					result: result.rows,
				});
			}
		});
}

Badge.addIcon = async (req, res) => {
	if (req.body.id === '') {
		res.json({
			message: "id is required",
			status: false,
		});
	} else {
		const userData = await sql.query(`select * from "badge" where id = $1`, [req.body.id]);
		if (userData.rowCount === 1) {

			let photo = userData.rows[0].icon;
			let { id } = req.body;
			console.log(req.file)
			if (req.file) {
				photo = req.file.path
			}

			sql.query(`UPDATE "badge" SET icon = $1 WHERE id = $2;`,
				[photo, id], async (err, result) => {
					if (err) {
						console.log(err);
						res.json({
							message: "Try Again",
							status: false,
							err
						});
					} else {
						if (result.rowCount === 1) {
							const data = await sql.query(`select * from "badge" where id = $1`, [req.body.id]);
							res.json({
								message: "Badge Icon added Successfully!",
								status: true,
								result: data.rows,
							});
						} else if (result.rowCount === 0) {
							res.json({
								message: "Not Found",
								status: false,
							});
						}
					}
				});
		} else {
			res.json({
				message: "Not Found",
				status: false,
			});
		}
	}
}
Badge.viewAll = async (req, res) => {
	const data = await sql.query(`SELECT COUNT(*) AS count FROM "badge"`);
	let limit = '10';
	let page = req.body.page;
	let result;
	if (!page || !limit) {
		result = await sql.query(`SELECT * FROM "badge" ORDER by createdat DESC `);
	}
	if (page && limit) {
		limit = parseInt(limit);
		let offset = (parseInt(page) - 1) * limit
		result = await sql.query(`SELECT * FROM "badge" ORDER by createdat DESC 
		LIMIT $1 OFFSET $2 ` , [limit, offset]);
	}
	if (result.rows) {
		res.json({
			message: "Badge Details",
			status: true,
			count: data.rows[0].count,
			result: result.rows,
		});
	} else {
		res.json({
			message: "could not fetch",
			status: false
		})
	}
}

Badge.update = async (req, res) => {
	if (req.body.id === '') {
		res.json({
			message: "id is required",
			status: false,
		});
	} else {
		const BadgeData = await sql.query(`select * from "badge" where id = $1`, [req.body.id]);
		const oldname = BadgeData.rows[0].name;
		const olddescription = BadgeData.rows[0].description;
		const oldCondition = BadgeData.rows[0].condition;
		let { name, description, condition, id } = req.body;

		if (name === undefined || name === '') {
			name = oldname;
		}
		if (condition === undefined || condition === '') {
			condition = oldCondition;
		}

		if (description === undefined || description === '') {
			description = olddescription;
		}
		sql.query(`UPDATE "badge" SET name =  $1, 
		description =  $2 , condition = $3 WHERE id = $4;`,
			[name, description, condition, id], async (err, result) => {
				if (err) {
					console.log(err);
					res.json({
						message: "Try Again",
						status: false,
						err
					});
				} else {
					if (result.rowCount === 1) {
						const data = await sql.query(`select * from "badge" where id = $1`, [req.body.id]);
						res.json({
							message: "Badge Updated Successfully!",
							status: true,
							result: data.rows,
						});
					} else if (result.rowCount === 0) {
						res.json({
							message: "Not Found",
							status: false,
						});
					}
				}
			});
	}
}
Badge.Streak = async (req, res) => {
	const waterTrackingData = await sql.query(`select * from "check_badge" where user_id = $1`, [req.body.user_id]);
	if (waterTrackingData.rowCount > 0) {
		const { user_id, tracker_id, start_at, daily_intake } = req.body;
		const check = await sql.query(`SELECT AGE('NOW()',updatedat) AS difference FROM check_badge where user_id = $1`, [req.body.user_id]);
		if (check.rowCount > 0) {
			console.log(check.rows[0].difference)
			if (check.rows[0].difference.days) {
				if (check.rows[0].difference.days <= 10 && check.rows[0].difference.months == 0 ) {
					res.json({
						message: "User has brass Badge Streak",
						status: true,
						result: check.rows[0].difference.days,
					});
				} else if (check.rows[0].difference.days > 10 && check.rows[0].difference.days >= 20  && check.rows[0].difference.months == 0) {
					res.json({
						message: "User has Silver Badge Streak",
						status: true,
						result: check.rows[0].difference.days,
					});
				} else if (check.rows[0].difference.days > 20 && check.rows[0].difference.days >= 30  && check.rows[0].difference.months == 0) {
					res.json({
						message: "User has platinum Badge Streak",
						status: true,
						result: check.rows[0].difference.days,
					});
				} else if (check.rows[0].difference.months == 1 && check.rows[0].difference.days <= 10) {
					res.json({
						message: "User has gold Badge Streak",
						status: true,
						months: check.rows[0].difference.months,
						days: check.rows[0].difference.days,
					});
				} else if (check.rows[0].difference.months == 1 && check.rows[0].difference.days <= 20) {
					res.json({
						message: "User has diamond Badge Streak",
						status: true,
						months: check.rows[0].difference.months,
						days: check.rows[0].difference.days,
					});
				} else if (check.rows[0].difference.months == 1 && check.rows[0].difference.days >= 20) {
					res.json({
						message: "User has ruby Badge Streak",
						status: true,
						result: check.rows[0].difference.days,
					});
				} else {
					res.json({
						message: "User has ruby Badge Streak",
						status: true,
						result: check.rows[0].difference.days,
					});
				}


			}
			else {
				res.json({
					message: "User has brass Badge Streak",
					status: true,
				});
			}
		} else {
			res.json({
				message: "User has brass Badge Streak",
				status: true,
			});
		}
	} else {
		res.json({
			message: "User has no Badge",
			status: false,
		});

	}


}

Badge.delete = async (req, res) => {
	const data = await sql.query(`select * from "badge" where id = $1`, [req.params.id]);
	if (data.rows.length === 1) {
		sql.query(`DELETE FROM "badge" WHERE id = $1;`, [req.params.id], (err, result) => {
			if (err) {
				res.json({
					message: "Try Again",
					status: false,
					err
				});
			} else {
				res.json({
					message: "Badge Deleted Successfully!",
					status: true,
					result: data.rows,

				});
			}
		});
	} else {
		res.json({
			message: "Not Found",
			status: false,
		});
	}
}
module.exports = Badge;