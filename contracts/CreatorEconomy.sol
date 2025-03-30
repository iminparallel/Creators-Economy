// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
//import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
//import "./PriceConverter.sol";
import "hardhat/console.sol";
error Milestones__UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);


contract CreatorEconomy is AutomationCompatibleInterface {
   
    enum MileStoneState {
        OPEN,
        CALCULATING
    } 

    struct Product_identifiers {
        address creator;
        address[] fans;
    }

    struct Creator_balance {
        address creator;
        uint256 balance;
        string[] identifier_list;
    }

    struct Milestone {
        address creator;
        uint256 totalMilestones;
        uint256 totalAmount;
        uint256 milestoneCompleted;
        uint256 amountWithdrawn;
        uint256 createdAt;
        bool isCompleted;
        uint256 endsAt;
        string product;
    }

    mapping(string => Product_identifiers) private identifiers; 
    mapping(address => Creator_balance) private balances; 
    mapping(string => Milestone) private products;  

    uint256 private constant MILESTONE_COUNT = 5;
    uint256 private constant PLATFORM_PERCENTAGE = 10; 
    uint256 private constant CREATOR_PERCENTAGE = 50; 
    uint256 private owner_balance ;

    address private platformWallet;
    string[] private activeMilestones;
    string[] private activeIdentifiers;

    uint256 private immutable i_interval;
    uint256 private s_lastTimeStamp;
    uint256 private s_milestone_price;

    event FundsLocked(address indexed user, uint256 amount);
    event MilestoneCompleted(address indexed user, uint256 milestone, uint256 amountReleased);
    event AllFundsWithdrawn(address indexed user, uint256 totalAmount);
    event OwnersWithdrawl(address indexed creator, uint256 amount);
    event PriceChange(uint256 amount);
    event BalanceCreated(address creator);
    event BalanceUpdated(address creator);
    event ProductCreated(address creator, string product);
    event CreatorsWithdrawl(address indexed creator, uint256 amount);

    MileStoneState private s_milestoneState;

    constructor(address _platformWallet, uint256 interval, uint256 price) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        platformWallet = _platformWallet;
        owner_balance = 0;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
        s_milestone_price = price;
    }

    modifier onlyOwner() {
        require(platformWallet == msg.sender, "Only the platform wallet can perform this action");
        _;
    }

    modifier onlyFans(string memory productId) {
        require(products[productId].creator == msg.sender, "Only the creator wallet can perform this action");
        _;
    }

    modifier whenOpen() {
        require(s_milestoneState == MileStoneState.OPEN, "Contract is in Upkeep");
        _;
    }

    function createProduct(string memory productId) external whenOpen() {
        console.log("product Id", productId);
        require(identifiers[productId].creator == address(0), "Product Already Exists");
        activeIdentifiers.push(productId);

        if (balances[msg.sender].creator == address(0)) {
            // First time creator
            balances[msg.sender].creator = msg.sender;
            balances[msg.sender].balance = 0;
            delete balances[msg.sender].identifier_list;
            console.log("product Id before pushing", productId);
            balances[msg.sender].identifier_list.push(productId);
            emit BalanceCreated(msg.sender);
        } else {
            balances[msg.sender].identifier_list.push(productId);
            emit BalanceUpdated(msg.sender);
        }

        address[] memory fansArray = new address[](0);
        identifiers[productId] = Product_identifiers({
            creator: msg.sender,
            fans: fansArray
        });

        emit ProductCreated(msg.sender, productId);
    }

    function lockFunds(string memory productId, string memory identifier) external whenOpen() payable {
        require(identifiers[identifier].creator != address(0), "No articles exist");
        require(msg.value >= s_milestone_price, "Sent amount must be higher than entry fee");
        require(products[productId].totalAmount == 0, "User already locked funds");

        activeMilestones.push(productId);
        uint256 fee = (msg.value * CREATOR_PERCENTAGE) / 100;
        uint256 netAmount = msg.value - fee;
        uint256 endsAt = block.timestamp + 3600*24*7;

        
        balances[msg.sender].balance += fee;
        identifiers[productId].fans.push(msg.sender);

        products[productId] = Milestone({
            creator: msg.sender,
            totalMilestones: MILESTONE_COUNT, 
            totalAmount: netAmount,
            milestoneCompleted: 0,
            amountWithdrawn: 0,
            createdAt: block.timestamp,
            isCompleted: false,
            endsAt: endsAt,
            product: identifier
        });

        emit FundsLocked(msg.sender, netAmount);
    }

    function checkUpkeep(bytes memory)
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory  )
    {
        bool isOpen = MileStoneState.OPEN == s_milestoneState;
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasActiveMilestones = activeMilestones.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (timePassed && isOpen && hasBalance && hasActiveMilestones);
        return (upkeepNeeded, "0x0"); 
    }  

    function performUpkeep(bytes calldata) external override {
        (bool upkeepNeeded,) = checkUpkeep("");
         require(upkeepNeeded, "Upkeep not needed");
        if (!upkeepNeeded) {
            revert Milestones__UpkeepNotNeeded(address(this).balance, activeMilestones.length, uint256(s_milestoneState));
        }
        s_milestoneState = MileStoneState.CALCULATING;
        string[] memory copiedActiveMilestone = activeMilestones;
        uint256 temp_owner_balance = owner_balance;
        uint256 j;
        j = 0;
        string[] memory updatedMileStones = new string[](copiedActiveMilestone.length); 
                
        for (uint256 i = 0; i < copiedActiveMilestone.length; i++) {
            string memory milestoneId = copiedActiveMilestone[i];
            Milestone storage milestone = products[milestoneId];
                    
            if (milestone.endsAt > block.timestamp) {
                updatedMileStones[j] = milestoneId;
                j++;
            } else {
                temp_owner_balance += milestone.totalAmount - milestone.amountWithdrawn;
            }
        }
        if (j < updatedMileStones.length) {
            string[] memory resizedMileStones = new string[](j);
            for (uint256 i = 0; i < j; i++) {
                resizedMileStones[i] = updatedMileStones[i];
            }
            activeMilestones = resizedMileStones;
        }
        owner_balance = temp_owner_balance;
        s_milestoneState = MileStoneState.OPEN;
    }  

    function completeMilestone(string memory productId) external whenOpen() onlyFans(productId){
        Milestone storage product = products[productId];
        require(product.totalAmount > 0, "No funds locked");
        require(product.endsAt >= block.timestamp, "Milestone Expired");
        require(product.milestoneCompleted < product.totalMilestones, "All milestones already completed");

        uint256 milestoneAmount = product.totalAmount / product.totalMilestones;
        product.milestoneCompleted++;

        if (product.milestoneCompleted == product.totalMilestones) {
            string[] memory copiedActiveMilestone = activeMilestones;
            string[] memory updatedMileStones = new string[] (copiedActiveMilestone.length - 1);
            uint256 j;
            j = 0;
            for (uint256 i = 0; i < copiedActiveMilestone.length; i++){
                if (keccak256(abi.encodePacked(copiedActiveMilestone[i])) != keccak256(abi.encodePacked(productId))) {
                    updatedMileStones[j] = copiedActiveMilestone[i];
                    j+=1;
                }
            }
            activeMilestones = updatedMileStones;

            uint256 remainingAmount = product.totalAmount - product.amountWithdrawn;
            product.amountWithdrawn += remainingAmount;
            product.isCompleted = true;
            payable(msg.sender).transfer(remainingAmount);
            emit AllFundsWithdrawn(msg.sender, product.totalAmount);
        } else {
            product.amountWithdrawn += milestoneAmount;
            payable(msg.sender).transfer(milestoneAmount);
            emit MilestoneCompleted(msg.sender, product.milestoneCompleted, milestoneAmount);
        }
    }

    function ownersWithdrawl( uint256 amount) external whenOpen() onlyOwner() {
        require(amount <= owner_balance * 70 / 100, "Amount exceeds collectable funds");
        payable(msg.sender).transfer(amount);
        owner_balance -= amount;
        emit OwnersWithdrawl(msg.sender, amount);
    }

    function creatorsWithdrawl( uint256 amount) external {
        Creator_balance storage balance = balances[msg.sender];
        require(amount <= balance.balance, "Amount exceeds collecteables funds");
        require(msg.sender == balance.creator, "Amount exceeds collected funds");
        payable(msg.sender).transfer(amount);
        balance.balance -= amount;
        balances[msg.sender] = balance;
        emit CreatorsWithdrawl(msg.sender, amount);
    }

    function changeMileStonePrice( uint256 amount) external whenOpen() onlyOwner() {
        s_milestone_price = amount;
        emit PriceChange(amount);
    }

    function getUserMilestoneDetails(string memory productId) public view returns (Milestone memory) {
        return products[productId];
    }

    function getCurrentTimestamp() public view returns (uint256) {
        return block.timestamp;
    }

    function getOwnerBalance() public view onlyOwner() returns (uint256) {
        return owner_balance;
    }

    function getIdentifiers() public view  returns (string[] memory) {
        return activeIdentifiers;
    }

    function getIdentifier(string memory productId) public view  returns (Product_identifiers memory) {
        return identifiers[productId];
    }

    function getBalance() public view  returns (Creator_balance memory) {
        return balances[msg.sender];
    }

    function getPrice() public view returns (uint256) {
        uint256 minimumUSD =  s_milestone_price; 
        return minimumUSD ;   
    }
}
