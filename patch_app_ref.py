import re
with open("src/App.tsx", "r") as f:
    content = f.read()

# Update ScreenTeam in single view
single_team_target = """              {activeSingleScreen === 'team' && (
                <ScreenTeam
                  levels={referralLevels}
                  rankRewards={rankRewards}
                  directSponsorPercent={systemConfig.directSponsorPercent}
                  onOpenTeamModal={() => setTeamModalOpen(true)}
                  onOpenMatrixModal={() => setMatrixModalOpen(true)}
                  levelIncomeUsd={levelIncomeUsd}
                  totalInvestedUsd={totalInvestedUsd}
                  minMlmQualifyUsd={systemConfig.minMlmQualifyUsd}
                  onOpenBuyModal={() => setBuyModalOpen(true)}
                />
              )}"""

single_team_replace = """              {activeSingleScreen === 'team' && (
                <ScreenTeam
                  levels={referralLevels}
                  rankRewards={rankRewards}
                  directSponsorPercent={systemConfig.directSponsorPercent}
                  onOpenTeamModal={() => setTeamModalOpen(true)}
                  onOpenMatrixModal={() => setMatrixModalOpen(true)}
                  levelIncomeUsd={levelIncomeUsd}
                  totalInvestedUsd={totalInvestedUsd}
                  minMlmQualifyUsd={systemConfig.minMlmQualifyUsd}
                  onOpenBuyModal={() => setBuyModalOpen(true)}
                  referralCode={userRefCode}
                />
              )}"""
content = content.replace(single_team_target, single_team_replace)


# Update ScreenTeam in trio view
trio_team_target = """                <ScreenTeam
                  levels={referralLevels}
                  rankRewards={rankRewards}
                  directSponsorPercent={systemConfig.directSponsorPercent}
                  onOpenTeamModal={() => setTeamModalOpen(true)}
                  onOpenMatrixModal={() => setMatrixModalOpen(true)}
                  levelIncomeUsd={levelIncomeUsd}
                  totalInvestedUsd={totalInvestedUsd}
                  minMlmQualifyUsd={systemConfig.minMlmQualifyUsd}
                  onOpenBuyModal={() => setBuyModalOpen(true)}
                />"""

trio_team_replace = """                <ScreenTeam
                  levels={referralLevels}
                  rankRewards={rankRewards}
                  directSponsorPercent={systemConfig.directSponsorPercent}
                  onOpenTeamModal={() => setTeamModalOpen(true)}
                  onOpenMatrixModal={() => setMatrixModalOpen(true)}
                  levelIncomeUsd={levelIncomeUsd}
                  totalInvestedUsd={totalInvestedUsd}
                  minMlmQualifyUsd={systemConfig.minMlmQualifyUsd}
                  onOpenBuyModal={() => setBuyModalOpen(true)}
                  referralCode={userRefCode}
                />"""
content = content.replace(trio_team_target, trio_team_replace)


# Update TeamPlanModal
modal_target = """      <TeamPlanModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        levels={referralLevels}
        rankRewards={rankRewards}
        directSponsorPercent={systemConfig.directSponsorPercent}
      />"""

modal_replace = """      <TeamPlanModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        levels={referralLevels}
        rankRewards={rankRewards}
        directSponsorPercent={systemConfig.directSponsorPercent}
        referralCode={userRefCode}
      />"""
content = content.replace(modal_target, modal_replace)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Replaced!")
