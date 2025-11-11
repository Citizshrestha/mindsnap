import { Call } from "../models/call.models.js";
import { CallSession } from "../models/callSession.models.js";
import {User} from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const initiateCall =asyncHandler(async (req, res) => {

    const {receiverId, callType} = req.body;
    const callerId = req.user._id;   // get caller id from authenticated user

    const receiver = await User.findById(receiverId);

    // validations

    // check if receiver exists 
    if (!receiver){
        return res.status(404).json({
            message: "Receiver not found!"
        });
    }
    
    // check if caller is trying to call themselves
    if(callerId.toString() === receiverId){
        return res.status(400).json({
            message: "Cannot call yourself"
        });
    }

    // check if receiver is busy it means in another call
    const receiverInCall = await CallSession.isUserInCall(receiverId);
    if (receiverInCall){
        return res.status(400).json({
            message: "Receiver is already in a call",
        });
    }
    
    // check if caller is already in a call
    const callerInCall = await CallSession.isUserInCall(callerId);
    if (callerInCall){
        return res.status(400).json({
            message: "You are already in a call",
        });
    }

    // CREATE NEW CALL RECORD
    const newCall = await Call.create({
      caller: callerId,
      receiver: receiverId,
      callType: callType, // 'video' or 'audio'
      status: "initiated", // Call started
    });

    // POPULATE the call with user details
    const populatedCall = await Call.findById(newCall._id)
      .populate("caller", "username profilePicture")
      .populate("receiver", "username profilePicture");

    // SEND RESPONSE
    res.status(201).json({
        message: "Call initiated successfully",
        call: populatedCall,
    });
    
});