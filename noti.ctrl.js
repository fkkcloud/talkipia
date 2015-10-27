
exports.getPushids = function(res_list, pushids, session, post, location){

	if (session.pushid == 'undefined') // there should be pushid
		return;

	if (session.pushid.length < 6) // pushid usually is bigger then 6 letters
		return;

	if (session.guid == post.guid) // we dont send push to themselves
		return;		

	if (session.onlinestat == true)
	{
		res_list.push(location);
		pushids.push(session.pushid);
	}
	else 
	{
		var t1 = session.lastupdate;		
		var t2 = new Date();		
		var dif = t1.getTime() - t2.getTime();

		console.log(t1.getTime(), 'vs', t2.getTime());

		var Seconds_from_T1_to_T2 = dif / 1000;		
		var Seconds_Between_Dates = Math.abs(Seconds_from_T1_to_T2);		

		if (Seconds_Between_Dates < 60 * 7 + 30) // offline less than 5min and 30s
		{
			res_list.push(location);
			pushids.push(session.pushid);
		}
		else if (Seconds_Between_Dates < 60 * 15 + 120 && Seconds_Between_Dates > 60 * 15) // offline more than 15 min and less than 17 min
		{
			res_list.push(location);	
			pushids.push(session.pushid);
		}
		else if (Seconds_Between_Dates < 60 * 45 + 120 && Seconds_Between_Dates > 60 * 45) // offline more than 45 min and less than 47 min
		{
			res_list.push(location);	
			pushids.push(session.pushid);
		}
		else if (Seconds_Between_Dates < 3600 + 120 && Seconds_Between_Dates > 3600) // offline more than 1hr and less than 1hr and 2min
		{
			res_list.push(location);	
			pushids.push(session.pushid);
		}
		else if (Seconds_Between_Dates < 3600 * 3 + 120 && Seconds_Between_Dates > 3600 * 3) // offline more than 1hr and less than 1hr and 2min
		{
			res_list.push(location);	
			pushids.push(session.pushid);
		}
		else if (Seconds_Between_Dates < 3600 * 6 + 120 && Seconds_Between_Dates > 3600 * 6) // offline more than 1hr and less than 1hr and 2min
		{
			res_list.push(location);	
			pushids.push(session.pushid);
		}
		else if (Seconds_Between_Dates < 3600 * 9 + 120 && Seconds_Between_Dates > 3600 * 9) // offline more than 1hr and less than 1hr and 2min
		{
			res_list.push(location);	
			pushids.push(session.pushid);
		}
		else if (Seconds_Between_Dates < 3600 * 24 + 120 && Seconds_Between_Dates > 3600 * 24) // offline more than 1 day and less than 1day and 2 min
		{
			res_list.push(location);	
			pushids.push(session.pushid);
		}
		else if (Seconds_Between_Dates < 2600 * 24 * 2 + 120 && Seconds_Between_Dates > 3600 * 24 * 2) // offline more than 1 day and less than 1day and 2 min
		{
			res_list.push(location);	
			pushids.push(session.pushid);
		}
	}

}


					